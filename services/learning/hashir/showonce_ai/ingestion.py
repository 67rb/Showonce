# Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md.
"""One deliberately narrow source: the reviewed Origami.me cup HTML tutorial."""
import hashlib
import concurrent.futures
import http.client
import ipaddress
import re
import socket
import ssl
import time
import threading
from html.parser import HTMLParser
from urllib.parse import urljoin, urlsplit

from .common import AIError, ROOT, VERSION, SAFETY, read_json, validate

SOURCE = "https://origami.me/cup/"
MAX_BYTES = 1_000_000
DNS_POOL = concurrent.futures.ThreadPoolExecutor(max_workers=2, thread_name_prefix="tutorial-dns")
DNS_CAPACITY = threading.BoundedSemaphore(2)


def normalize(text):
    return " ".join(text.split())


def digest(text):
    return hashlib.sha256(normalize(text).encode()).hexdigest()


def validate_url(url):
    try:
        p = urlsplit(url) if isinstance(url, str) and len(url) <= 2048 else None
        if not p or p.scheme != "https" or not p.hostname or p.username or p.password or p.port not in (None, 443):
            raise ValueError()
    except (ValueError, TypeError):
        raise AIError("invalid_link", "Use an HTTPS tutorial URL without credentials or a custom port.") from None
    if p.hostname != "origami.me" or p.path != "/cup/" or p.query or p.fragment:
        raise AIError("unsupported_link", "Only https://origami.me/cup/ is supported by this version.")
    return SOURCE


class PinnedHTTPS(http.client.HTTPSConnection):
    """Connect to the validated IP while retaining TLS SNI/hostname verification."""
    def __init__(self, ip, timeout):
        super().__init__("origami.me", timeout=timeout, context=ssl.create_default_context())
        self.ip = ip

    def connect(self):
        raw = socket.create_connection((self.ip, 443), self.timeout)
        try:
            self.sock = self._context.wrap_socket(raw, server_hostname=self.host)
        except BaseException:
            raw.close()
            raise


class SafeHTMLFetcher:
    def __init__(self, timeout=12, resolver=socket.getaddrinfo, connection_factory=PinnedHTTPS):
        self.timeout, self.resolver, self.connection_factory = timeout, resolver, connection_factory

    def fetch(self, url):
        url = validate_url(url)
        deadline = time.monotonic() + self.timeout
        try:
            # The only DNS name is a fixed allowlist entry. Validate EVERY returned
            # address and pin the socket so a second lookup cannot rebind it.
            if not DNS_CAPACITY.acquire(blocking=False):
                raise AIError("source_busy", "Source resolution is busy. Retry shortly.", True, 503)
            try:
                lookup = DNS_POOL.submit(self.resolver, "origami.me", 443, type=socket.SOCK_STREAM)
            except Exception:
                DNS_CAPACITY.release()
                raise
            lookup.add_done_callback(lambda _: DNS_CAPACITY.release())
            addresses = lookup.result(timeout=max(0, deadline - time.monotonic()))
            ips = [a[4][0] for a in addresses]
            if not ips or any(not ipaddress.ip_address(ip).is_global or ipaddress.ip_address(ip).is_multicast for ip in ips):
                raise AIError("blocked_source", "Source did not resolve to public network addresses.")
            for _ in range(3):
                remaining = deadline - time.monotonic()
                if remaining <= 0:
                    raise TimeoutError()
                connection = self.connection_factory(ips[0], remaining)
                try:
                    connection.request("GET", urlsplit(url).path, headers={
                        "User-Agent": "ShowOnce-Local-Learning-Demo/1.0", "Accept": "text/html", "Accept-Encoding": "identity"})
                    response = connection.getresponse()
                    if response.status in (301, 302, 303, 307, 308):
                        # Redirects must still match the exact allowlist. Never fetch
                        # a new host, a private IP, or arbitrary relative endpoints.
                        url = validate_url(urljoin(url, response.getheader("Location", "")))
                        continue
                    if response.status != 200:
                        raise AIError("inaccessible_source", "Tutorial source is unavailable.", True, 502)
                    if response.getheader("Content-Type", "").split(";")[0].lower() != "text/html" or response.getheader("Content-Encoding", "identity") != "identity":
                        raise AIError("unsupported_source", "Source must return uncompressed HTML.")
                    length = response.getheader("Content-Length")
                    if length and int(length) > MAX_BYTES:
                        raise AIError("source_too_large", "Tutorial exceeds the 1 MB source limit.")
                    chunks, size = [], 0
                    while True:
                        remaining = deadline - time.monotonic()
                        if remaining <= 0:
                            raise TimeoutError()
                        if connection.sock:
                            connection.sock.settimeout(remaining)
                        chunk = response.read1(min(32768, MAX_BYTES + 1 - size))
                        if not chunk:
                            break
                        size += len(chunk)
                        if size > MAX_BYTES:
                            raise AIError("source_too_large", "Tutorial exceeds the 1 MB source limit.")
                        chunks.append(chunk)
                    return b"".join(chunks).decode("utf-8")
                finally:
                    connection.close()
            raise AIError("source_redirect_limit", "Tutorial redirected too many times.")
        except AIError:
            raise
        except (TimeoutError, socket.timeout):
            raise AIError("source_timeout", "Tutorial fetch timed out.", True, 504) from None
        except Exception:
            raise AIError("inaccessible_source", "Could not read the supported tutorial.", True, 502) from None


class FixtureFetcher:
    """Authored/paraphrased HTML fixture, NOT a saved copy of the source website."""
    def fetch(self, url):
        validate_url(url)
        return (ROOT / "fixtures" / "cup.html").read_text()


class StepHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.capture = None
        self.text = []
        self.blocks = []
        self.ignored = 0

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style", "noscript"):
            self.ignored += 1
        if not self.ignored and tag in ("h3", "p"):
            self.capture, self.text = tag, []

    def handle_endtag(self, tag):
        if tag in ("script", "style", "noscript"):
            self.ignored = max(0, self.ignored - 1)
        if tag == self.capture:
            self.blocks.append((tag, normalize("".join(self.text))))
            self.capture = None

    def handle_data(self, data):
        if self.capture and not self.ignored:
            self.text.append(data)


def extract(html):
    if not isinstance(html, str) or not html.strip():
        raise AIError("empty_source", "The tutorial contained no readable content.")
    if len(html.encode()) > MAX_BYTES:
        raise AIError("source_too_large", "Tutorial exceeds the 1 MB source limit.")
    parser = StepHTMLParser()
    parser.feed(html)
    steps, pending = [], None
    for tag, text in parser.blocks:
        if tag == "h3":
            match = re.fullmatch(r"Step (\d+)", text)
            pending = int(match[1]) if match else None
        elif pending is not None and text:
            steps.append({"position": pending, "text": text})
            pending = None
    if [s["position"] for s in steps] != list(range(1, 8)):
        raise AIError("insufficient_source", "Expected seven ordered cup instructions; source layout needs review.")
    return steps


class ReviewedCupModel:
    """Deterministic, reviewed grounding adapter. No LLM, prompts, or credit use.

    Only known text digests can select authored instructions; changed or injected
    source text fails closed rather than becoming application instructions.
    """
    def generate(self, extracted):
        template = read_json("cup-template.json")
        if any(digest(s["text"]) not in t["accepted_source_hashes"] for s, t in zip(extracted, template["steps"], strict=True)):
            raise AIError("insufficient_source", "Tutorial wording changed or is unreviewed. Review it before generating steps.")
        return template


class TutorialPipeline:
    def __init__(self, fetcher=None, model=None):
        self.fetcher = fetcher or FixtureFetcher()
        self.model = model or ReviewedCupModel()

    def process(self, source_url):
        validate_url(source_url)
        extracted = extract(self.fetcher.fetch(source_url))
        data = self.model.generate(extracted)
        steps = []
        for item, source in zip(data["steps"], extracted, strict=True):
            steps.append({k: v for k, v in item.items() if k != "accepted_source_hashes"} | {
                "source_reference": {"url": SOURCE, "section": f"Step {source['position']}", "text_sha256": digest(source["text"])}})
        lesson = {k: v for k, v in data.items() if k != "steps"} | {
            "id": "lesson_cup_" + digest("|".join(s["text"] for s in extracted))[:16],
            "schema_version": VERSION, "source_url": SOURCE, "steps": steps,
            "content_origin": "authored_fixture" if isinstance(self.fetcher, FixtureFetcher) else "reviewed_html",
            "safety_notice": SAFETY}
        return validate("lesson", lesson)
