"""Unit tests for the downloader contract. yt-dlp is mocked: no network, no downloads."""
import os
import sys
import unittest
from unittest.mock import patch

os.environ.setdefault("DOWNLOADER_TOKEN", "test-token")
sys.path.insert(0, os.path.dirname(__file__))
import server


class FakeDL:
    info = {"duration": 89, "title": "Visible demonstration"}

    def __init__(self, options):
        self.options = options

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def extract_info(self, url, download=False):
        return dict(self.info)


class ValidateUrl(unittest.TestCase):
    def test_accepts_supported_https_video_hosts(self):
        self.assertEqual(server.validate_url("https://www.youtube.com/watch?v=aqz-KE-bpKQ"),
                         "https://www.youtube.com/watch?v=aqz-KE-bpKQ")
        self.assertEqual(server.validate_url("https://instagram.com/reel/ABC/"),
                         "https://instagram.com/reel/ABC/")

    def test_rejects_credentials_non_https_and_unknown_hosts(self):
        for value in ["http://www.youtube.com/watch?v=x",
                      "https://user:pass@www.youtube.com/watch?v=x",
                      "https://example.com/clip.mp4",
                      "not a url", "", None, 42]:
            with self.assertRaises(server.DownloadError, msg=repr(value)):
                server.validate_url(value)


class Probe(unittest.TestCase):
    def test_duration_limit_is_enforced_before_download(self):
        with patch.object(server.yt_dlp, "YoutubeDL", FakeDL):
            self.assertEqual(server.probe("https://youtu.be/abc")["duration"], 89.0)
        FakeDL.info = {"duration": 99999, "title": "Long"}
        try:
            with patch.object(server.yt_dlp, "YoutubeDL", FakeDL):
                with self.assertRaises(server.DownloadError) as ctx:
                    server.probe("https://youtu.be/abc")
            self.assertEqual(ctx.exception.code, "source_video_duration")
        finally:
            FakeDL.info = {"duration": 89, "title": "Visible demonstration"}

    def test_live_and_playlist_are_rejected(self):
        FakeDL.info = {"duration": 89, "title": "Live", "is_live": True}
        try:
            with patch.object(server.yt_dlp, "YoutubeDL", FakeDL):
                with self.assertRaises(server.DownloadError) as ctx:
                    server.probe("https://youtu.be/abc")
            self.assertEqual(ctx.exception.code, "source_live")
        finally:
            FakeDL.info = {"duration": 89, "title": "Visible demonstration"}


class Download(unittest.TestCase):
    def test_download_returns_only_valid_mp4_bytes(self):
        import tempfile
        from pathlib import Path

        class DownloadingDL(FakeDL):
            def extract_info(self, url, download=False):
                if download:
                    Path(self.options["outtmpl"].replace("%(ext)s", "mp4")).write_bytes(
                        b"\x00\x00\x00\x18ftypisom" + b"\x00" * 2048)
                return dict(self.info)

        with tempfile.TemporaryDirectory() as directory, \
                patch.object(server.yt_dlp, "YoutubeDL", DownloadingDL):
            data = server.download("https://youtu.be/abc", directory)
        self.assertTrue(data[4:8] == b"ftyp" and len(data) > 1024)


class Jobs(unittest.TestCase):
    def test_create_job_returns_chunk_contract_without_paths(self):
        import shutil
        from pathlib import Path

        def fake_download(url, directory):
            path = Path(directory) / "video.mp4"
            path.write_bytes(b"\x00\x00\x00\x18ftypisom" + b"\x00" * 2048)
            return path

        def fake_split(path, directory):
            chunks = []
            for index, (start, duration) in enumerate([(0.0, 300.0), (300.0, 120.0)]):
                file = Path(directory) / f"chunk_{index:03d}.mp4"
                file.write_bytes(b"\x00\x00\x00\x18ftypisom" + b"\x00" * 2048)
                chunks.append({"index": index, "start_seconds": start,
                               "duration_seconds": duration, "path": file, "bytes": file.stat().st_size})
            return chunks

        with patch.object(server, "probe", return_value={"duration": 420.0, "title": "Tutorial"}), \
                patch.object(server, "download_file", side_effect=fake_download), \
                patch.object(server, "split_video", side_effect=fake_split):
            job = server.create_job("https://www.youtube.com/watch?v=aqz-KE-bpKQ")
        try:
            self.assertEqual(job["duration"], 420.0)
            self.assertEqual([c["start_seconds"] for c in job["chunks"]], [0.0, 300.0])
            self.assertTrue(all("path" not in c for c in job["chunks"]))
            self.assertIn(job["job_id"], server.JOBS)
            # Signed handoff paths carry an expiry and an HMAC, never the token.
            for chunk in job["chunks"]:
                self.assertIn("sig=", chunk["signed_path"])
                self.assertNotIn("test-token", chunk["signed_path"])
            path = job["chunks"][0]["signed_path"]
            query = dict(pair.split("=", 1) for pair in path.split("?", 1)[1].split("&"))
            self.assertTrue(server.valid_chunk_signature(job["job_id"], 0, query["exp"], query["sig"]))
            self.assertFalse(server.valid_chunk_signature(job["job_id"], 0, query["exp"], "0" * 64))
            self.assertFalse(server.valid_chunk_signature(job["job_id"], 1, query["exp"], query["sig"]))
            self.assertFalse(server.valid_chunk_signature(job["job_id"], 0, 1, query["sig"]))
        finally:
            entry = server.JOBS.pop(job["job_id"], None)
            if entry:
                shutil.rmtree(entry["directory"], ignore_errors=True)


if __name__ == "__main__":
    unittest.main()
