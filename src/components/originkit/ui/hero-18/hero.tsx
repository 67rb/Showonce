"use client";

import HeroBackgroundTablet from "@/components/originkit/ui/hero-18/hero-background-tablet";
import HeroBackgroundMobile from "@/components/originkit/ui/hero-18/hero-background-mobile";
import Vortex from "@/components/originkit/ui/tornado";
import s from "@/lib/strings";
import { ModeToggle } from "@/components/ModeToggle";

function asset(file: string) {
  return `/originkit/hero-18/${file}`;
}

const imgDiagonalLines = asset("diagonal-lines.png");
const imgDiagonalLines1 = asset("diagonal-lines-1.svg");
const imgDiagonalLines2 = asset("diagonal-lines-2.svg");
const imgDiagonalLines3 = asset("diagonal-lines-3.svg");
const imgPolygon1 = asset("polygon-1.svg");
const imgPolygon2 = asset("polygon-2.svg");
const imgGroup = asset("group.svg");
const imgElement = asset("element.svg");
const imgElement1 = asset("element-1.svg");
const imgElement2 = asset("element-2.svg");
const imgElement3 = asset("element-3.svg");
const imgElement4 = asset("element-4.svg");
const imgElements = asset("elements.svg");
const imgEllipse = asset("ellipse.svg");
const imgEllipse1 = asset("ellipse-1.svg");

const inter = "font-[family-name:var(--font-inter)]";
const lato = "font-[family-name:var(--font-lato)]";
const instrumentSerif = "font-[family-name:var(--font-instrument-serif)]";

export default function Hero() {
  return (
    <div className="relative w-full overflow-hidden bg-[#0a0a0a] lg:h-full h18-background">
      {}
      <div className="md:hidden">
        <HeroBackgroundMobile />
      </div>

      {}
      <div className="hidden md:block lg:hidden">
        <HeroBackgroundTablet />
      </div>

      {}
      <div className="pointer-events-none absolute -top-[127px] left-0 hidden h-full w-full lg:block">
        <div
          className="drop-shadow-[0px_4px_7px_rgba(0,0,0,0.25)] relative size-full"
          style={{ transform: "scaleX(-1)", transformOrigin: "720px 0" }}
        >
          <div className="absolute contents left-[-294.8px] top-[-567.51px]">
            <div className="absolute contents left-[299.96px] size-[1866.579px] top-[-738.76px]">
              <div className="absolute flex items-center justify-center left-[961.61px] size-[1204.928px] top-[-738.76px]">
                <div className="flex-none rotate-45">
                  <div
                    className="h-[887.578px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[138.846px_171.255px] mask-size-[2322.501px_2322.501px] relative w-[816.448px]"
                    style={{ maskImage: `url("${imgElement}")` }}
                  >
                    <div className="absolute inset-[-29.85%_-32.46%]">
                      <img alt="" className="block max-w-none size-full" src={imgElement1} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute flex h-[1027.001px] items-center justify-center left-[463.52px] mix-blend-plus-lighter top-[-190.98px] w-[995.599px]">
                <div className="flex-none rotate-[43.56deg] skew-x-[-0.22deg]">
                  <div
                    className="bg-gradient-to-b blur-[15.303px] from-[#52ae54] h-[1253.563px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[-568.574px_-376.532px] mask-size-[2322.501px_2322.501px] opacity-30 relative to-[80%] to-[rgba(82,174,84,0)] w-[176.97px]"
                    style={{ maskImage: `url("${imgElement}")` }}
                  />
                </div>
              </div>
              <div className="absolute flex h-[1001.24px] items-center justify-center left-[530.89px] mix-blend-plus-lighter top-[-97.69px] w-[1021.671px]">
                <div className="flex-none rotate-[45.93deg] skew-x-[0.14deg]">
                  <div
                    className="bg-gradient-to-b blur-[27.029px] from-[#52ae54] h-[1253.592px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[-475.135px_-469.815px] mask-size-[2322.501px_2322.501px] opacity-80 relative to-[88%] to-[rgba(82,174,84,0)] w-[176.965px]"
                    style={{ maskImage: `url("${imgElement}")` }}
                  />
                </div>
              </div>
              <div className="absolute flex h-[972.247px] items-center justify-center left-[608.38px] top-[-3.5px] w-[1047.775px]">
                <div className="flex-none rotate-[48.45deg] skew-x-[0.52deg]">
                  <div
                    className="bg-[rgba(82,174,84,0)] blur-[15.833px] h-[1253.321px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[-371.539px_-564.01px] mask-size-[2322.501px_2322.501px] opacity-30 relative w-[177.01px]"
                    style={{ maskImage: `url("${imgElement}")` }}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="absolute contents left-[299.96px] size-[1866.58px] top-[-738.76px]">
            <div className="absolute flex items-center justify-center left-[961.61px] size-[1204.928px] top-[-738.76px]">
              <div className="flex-none rotate-45">
                <div className="h-[887.578px] relative w-[816.448px]">
                  <div className="absolute inset-[-29.85%_-32.46%]">
                    <img alt="" className="block max-w-none size-full" src={imgElement1} />
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute flex h-[1027.001px] items-center justify-center left-[463.52px] mix-blend-plus-lighter top-[-190.98px] w-[995.599px]">
              <div className="flex-none rotate-[43.56deg] skew-x-[-0.22deg]">
                <div className="bg-gradient-to-b blur-[15.303px] from-[#52ae54] h-[1253.563px] opacity-30 relative to-[80%] to-[rgba(82,174,84,0)] w-[176.97px]" />
              </div>
            </div>
            <div className="absolute flex h-[1001.24px] items-center justify-center left-[577px] top-[-102px] w-[1021.671px]">
              <div className="flex-none rotate-[45.93deg] skew-x-[0.14deg]">
                <div
                  className="blur-[27.029px] h-[1253.592px] opacity-51 relative w-[176.965px]"
                  style={{
                    backgroundImage:
                      "linear-gradient(179.20787263074158deg, rgb(82, 174, 84) 23.065%, rgba(82, 174, 84, 0.737) 14.923%, rgba(82, 174, 84, 0.307) 51.616%, rgba(82, 174, 84, 0) 99.903%)",
                  }}
                />
              </div>
            </div>
            <div className="absolute flex h-[972.247px] items-center justify-center left-[608.38px] top-[-3.5px] w-[1047.775px]">
              <div className="flex-none rotate-[48.45deg] skew-x-[0.52deg]">
                <div className="bg-[rgba(82,174,84,0)] blur-[15.833px] h-[1253.321px] opacity-30 relative w-[177.01px]" />
              </div>
            </div>
            <div className="absolute flex items-center justify-center left-[930.06px] mix-blend-plus-lighter size-[597.079px] top-[29.37px]">
              <div className="flex-none rotate-45">
                <div className="h-[844.398px] relative w-0">
                  <div className="absolute inset-[-3.06%_-28.45px]">
                    <img alt="" className="block max-w-none size-full" src={imgElement2} />
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute flex items-center justify-center left-[727.28px] mix-blend-plus-lighter size-[597.079px] top-[-114.14px]">
              <div className="flex-none rotate-45">
                <div className="h-[844.398px] relative w-0">
                  <div className="absolute inset-[-3.06%_-28.45px]">
                    <img alt="" className="block max-w-none size-full" src={imgElement2} />
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute flex items-center justify-center left-[866.38px] mix-blend-plus-lighter size-[446.999px] top-[72.37px]">
              <div className="flex-none rotate-45">
                <div className="h-[632.151px] relative w-0">
                  <div className="absolute inset-[-4.08%_-26.46px]">
                    <img alt="" className="block max-w-none size-full" src={imgElement3} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute contents left-[-239.55px] size-[1955.623px] top-[-880.31px]">
            <div className="absolute flex items-center justify-center left-[467.8px] size-[1248.275px] top-[-880.31px]">
              <div className="flex-none rotate-45">
                <div className="h-[948.879px] opacity-30 relative w-[816.448px]">
                  <div className="absolute inset-[-27.93%_-32.46%]">
                    <img alt="" className="block max-w-none size-full" src={imgElement4} />
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute flex h-[1087.991px] items-center justify-center left-[-75.99px] mix-blend-plus-lighter top-[-304.68px] w-[1057.022px]">
              <div className="flex-none rotate-[43.47deg] skew-x-[-0.4deg]">
                <div className="bg-gradient-to-b blur-[15px] from-[#52ae54] h-[1340.103px] opacity-9 relative to-[88%] to-[rgba(82,174,84,0)] w-[176.978px]" />
              </div>
            </div>
            <div className="absolute flex h-[1062.596px] items-center justify-center left-[-8.45px] mix-blend-plus-lighter top-[-211.58px] w-[1082.746px]">
              <div className="flex-none rotate-46 skew-x-[0.26deg]">
                <div className="bg-gradient-to-b blur-[28px] from-[#52ae54] h-[1340.156px] opacity-24 relative to-[88%] to-[rgba(82,174,84,0)] w-[176.969px]" />
              </div>
            </div>
            <div className="absolute flex h-[1033.896px] items-center justify-center left-[69.65px] top-[-117.91px] w-[1108.382px]">
              <div className="flex-none rotate-[48.69deg] skew-x-[0.95deg]">
                <div className="bg-[rgba(82,174,84,0)] blur-[16px] h-[1339.663px] opacity-9 relative w-[177.056px]" />
              </div>
            </div>
          </div>
          <div className="absolute contents left-[-551.67px] size-[1715.427px] top-[-857.71px]">
            <div className="absolute flex items-center justify-center left-[32.41px] size-[1131.347px] top-[-857.71px]">
              <div className="flex-none rotate-45">
                <div className="h-[783.518px] opacity-30 relative w-[816.448px]">
                  <div className="absolute inset-[-33.44%_-32.09%]">
                    <img alt="" className="block max-w-none size-full" src={imgElements} />
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute flex h-[923.47px] items-center justify-center left-[-388.11px] mix-blend-plus-lighter top-[-357.18px] w-[891.334px]">
              <div className="flex-none rotate-[43.73deg] skew-x-[0.11deg]">
                <div
                  className="blur-[40px] h-[1106.666px] opacity-24 relative w-[176.958px]"
                  style={{
                    backgroundImage:
                      "linear-gradient(180.31009561457427deg, rgb(82, 174, 84) 38.81%, rgba(82, 174, 84, 0) 72.523%)",
                  }}
                />
              </div>
            </div>
            <div className="absolute flex h-[897.087px] items-center justify-center left-[-321.04px] mix-blend-plus-lighter top-[-263.59px] w-[917.996px]">
              <div className="flex-none rotate-[45.82deg] skew-x-[-0.07deg]">
                <div className="bg-[rgba(82,174,84,0)] blur-[40px] h-[1106.651px] opacity-24 relative w-[176.96px]" />
              </div>
            </div>
            <div className="absolute flex h-[867.597px] items-center justify-center left-[-244.58px] top-[-168.51px] w-[944.893px]">
              <div className="flex-none rotate-[48.05deg] skew-x-[-0.27deg]">
                <div className="bg-[rgba(82,174,84,0)] blur-[15.833px] h-[1106.791px] opacity-9 relative w-[176.939px]" />
              </div>
            </div>
          </div>
          <div className="absolute flex items-center justify-center left-[-126.42px] mix-blend-plus-lighter size-[963.238px] top-[-269.64px]">
            <div className="flex-none rotate-45">
              <div className="h-[1240.037px] relative w-[122.187px]">
                <div className="absolute inset-[-8.06%_-81.84%]">
                  <img alt="" className="block max-w-none size-full" src={imgEllipse} />
                </div>
              </div>
            </div>
          </div>
          <div className="absolute flex items-center justify-center left-[349.92px] mix-blend-plus-lighter size-[963.238px] top-[-356.04px]">
            <div className="flex-none rotate-45">
              <div className="h-[1240.037px] relative w-[122.187px]">
                <div className="absolute inset-[-3.71%_-37.65%]">
                  <img alt="" className="block max-w-none size-full" src={imgEllipse1} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="hidden lg:contents">
        <div className="absolute contents left-[859px] top-[-79px]">
          <div
            className="absolute bg-size-[7px_7px] bg-top-left h-[762px] left-[651px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[156px_-53px] mask-size-[811px_855px] top-[-78px] w-[1296px]"
            style={{ backgroundImage: `url("${imgDiagonalLines}")`, maskImage: `url("${imgDiagonalLines1}")` }}
          />
        </div>
        <div className="absolute contents left-[465px] top-[41px]">
          <div
            className="absolute bg-size-[7px_7px] bg-top-left h-[762px] left-[361.4px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[168.353px_100.314px] mask-size-[474.229px_622.65px] top-[-78.24px] w-[1296px]"
            style={{ backgroundImage: `url("${imgDiagonalLines}")`, maskImage: `url("${imgDiagonalLines2}")` }}
          />
        </div>
        <div className="absolute contents left-[-50px] top-[302px]">
          <div
            className="absolute bg-size-[7px_7px] bg-top-left h-[762px] left-[-258px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[156px_-53px] mask-size-[685px_658px] top-[303px] w-[1296px]"
            style={{ backgroundImage: `url("${imgDiagonalLines}")`, maskImage: `url("${imgDiagonalLines3}")` }}
          />
        </div>
      </div>

      {}
      <nav className="relative z-20 flex items-center justify-between px-6 py-5 md:px-10 md:py-6 lg:hidden">
        <div className="flex items-center gap-[8px]">
          <p className={`${inter} font-semibold text-[20px] text-white tracking-[-0.4px] whitespace-nowrap`}>
            <span className="text-white">SHOW</span>
            <span className="text-[#16A34A]">ONCE</span>
          </p>
        </div>
        <ModeToggle />
      </nav>

      {}
      <div
        className="pointer-events-none hidden lg:absolute lg:inset-y-0 lg:z-10 lg:block lg:w-[1440px]"
        style={{
          left: "max(0px, calc((100% - 1440px) / 2))",
          transform: "scale(min(1, calc(100vw / 1440px)))",
          transformOrigin: "top left",
        }}
      >
      <nav className="pointer-events-auto lg:absolute lg:content-stretch lg:flex items-center justify-between left-[52px] top-[36px] w-[1336.357px]">
        <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
          <p className={`${inter} font-semibold leading-[25.5px] relative shrink-0 text-[20px] text-white tracking-[-0.4px] whitespace-nowrap`}>
            <span className="text-white">SHOW</span>
            <span className="text-[#16A34A]">ONCE</span>
          </p>
        </div>
        <div className="content-stretch flex items-center justify-end relative shrink-0 w-[299px]">
          <ModeToggle />
        </div>
      </nav>
      </div>

      {}
      <div className="relative z-10 flex flex-col items-center gap-[40px] px-6 pb-[20px] pt-[16px] text-center md:gap-[56px] md:px-10 md:pb-[24px] md:pt-[24px] lg:hidden">
        <div className="flex flex-col items-center gap-[20px] md:gap-[24px]">
          <div className="flex flex-col items-center gap-[14px] text-white md:gap-[16px]">
            <h1 className={`${instrumentSerif} max-w-[280px] font-normal leading-[1.15] text-[34px] tracking-[-0.68px] md:max-w-[460px] md:text-[52px] md:leading-[1.1] md:tracking-[-1.04px]`}>
              {s.proHeroHeadline}<br />{s.proHeroHeadlineAccent}
            </h1>
            <p className={`${lato} max-w-[320px] text-[15px] leading-[1.4] opacity-70 md:max-w-[440px] md:text-[18px]`}>
              {s.proHeroSub}
            </p>
          </div>
          <div className="flex items-center gap-[12px] md:gap-[16px]">
            <a
              href="/professional/create"
              className="relative flex items-center justify-between gap-[8px] overflow-clip rounded-[12px] border-t border-[rgba(255,255,255,0.15)] py-[12px] pl-[18px] pr-[12px] shadow-[0px_3px_6px_0px_rgba(82,82,82,0.1)] transition-[filter] duration-150 hover:brightness-110 md:py-[14px] md:pl-[24px] md:pr-[14px]"
            >
              <div
                aria-hidden
                className="absolute inset-0 pointer-events-none rounded-[12px]"
                style={{
                  backgroundImage:
                    "linear-gradient(180deg, rgba(255, 255, 255, 0.2) 4.0988%, rgba(255, 255, 255, 0) 43.902%), linear-gradient(90deg, rgb(26, 120, 28) 0%, rgb(26, 120, 28) 100%)",
                }}
              />
              <p className={`${lato} relative font-bold text-[14px] text-white tracking-[-0.28px] whitespace-nowrap md:text-[16px]`}>
                {s.proHeroPrimaryCta}
              </p>
              <div className="relative shrink-0 size-[18px] md:size-[22px]">
                <div className="absolute inset-[28.66%_35.71%_23.78%_35.72%]">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup} />
                </div>
              </div>
              <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_1px_1px_0px_rgba(255,255,255,0.3)]" />
            </a>
            <a
              href="/professional/lessons"
              className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.1)] border-solid flex items-center justify-center gap-[10px] rounded-[10px] py-[12px] pl-[18px] pr-[12px] transition-colors duration-150 hover:bg-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.2)] md:py-[14px] md:pl-[24px] md:pr-[14px]"
            >
              <p className={`${lato} text-[13px] text-white tracking-[-0.35px] whitespace-nowrap md:text-[14px]`}>
                {s.proHeroSecondaryCta}
              </p>
              <div className="relative shrink-0 size-[18px] md:size-[22px]">
                <div className="absolute inset-[28.66%_35.71%_23.78%_35.72%]">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup} />
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* desktop content — lg-only, mirrors the mobile block */}
      <div
        className="pointer-events-none hidden lg:absolute lg:inset-y-0 lg:z-10 lg:block lg:w-[1440px]"
        style={{
          left: "max(0px, calc((100% - 1440px) / 2))",
          transform: "scale(min(1, calc(100vw / 1440px)))",
          transformOrigin: "top left",
        }}
      >
      <div className="pointer-events-auto lg:absolute lg:content-stretch lg:flex flex-col gap-[72px] items-start left-[82px] top-[207px] w-[688px]">
        <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0">
          <div className="content-stretch flex flex-col gap-[32px] items-start relative shrink-0">
            <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 text-white">
              <h1 className={`${instrumentSerif} font-normal leading-[1.1] relative shrink-0 text-[62px] tracking-[-1.24px] w-[502px]`}>
                {s.proHeroHeadline}<br />{s.proHeroHeadlineAccent}
              </h1>
              <p className={`${lato} font-normal leading-[normal] opacity-70 relative shrink-0 text-[20px] tracking-[-0.4px] w-[474px]`}>
                {s.proHeroSub}
              </p>
            </div>
            <div className="content-stretch flex gap-[16px] items-center relative shrink-0">
              <a
                href="/professional/create"
                className="border-[rgba(255,255,255,0.15)] border-solid border-t content-stretch flex items-center justify-between overflow-clip pl-[24px] pr-[14px] py-[14px] relative rounded-[12px] shadow-[0px_63px_18px_0px_rgba(82,82,82,0),0px_40px_16px_0px_rgba(82,82,82,0.01),0px_23px_14px_0px_rgba(82,82,82,0.05),0px_10px_10px_0px_rgba(82,82,82,0.09),0px_3px_6px_0px_rgba(82,82,82,0.1)] shrink-0 w-[136px] transition-[filter] duration-150 hover:brightness-110"
              >
                <div
                  aria-hidden
                  className="absolute inset-0 pointer-events-none rounded-[12px]"
                  style={{
                    backgroundImage:
                      "linear-gradient(180deg, rgba(255, 255, 255, 0.2) 4.0988%, rgba(255, 255, 255, 0) 43.902%), linear-gradient(90deg, rgb(26, 120, 28) 0%, rgb(26, 120, 28) 100%)",
                  }}
                />
                <p className={`${lato} font-bold leading-[1.5] relative shrink-0 text-[16px] text-white tracking-[-0.32px] whitespace-nowrap`}>
                  {s.proHeroPrimaryCta}
                </p>
                <div className="relative shrink-0 size-[22px]">
                  <div className="absolute inset-[28.66%_35.71%_23.78%_35.72%]">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup} />
                  </div>
                </div>
                <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_1px_1px_0px_rgba(255,255,255,0.3)]" />
              </a>
              <a
                href="/professional/lessons"
                className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.1)] border-solid content-stretch flex gap-[10px] h-full items-center justify-center pl-[24px] pr-[14px] py-[14px] relative rounded-[10px] shrink-0 transition-colors duration-150 hover:bg-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.2)]"
              >
                <p className={`${lato} font-normal leading-[1.5] relative shrink-0 text-[14px] text-white tracking-[-0.42px] whitespace-nowrap`}>
                  {s.proHeroSecondaryCta}
                </p>
                <div className="relative shrink-0 size-[22px]">
                  <div className="absolute inset-[28.66%_35.71%_23.78%_35.72%]">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup} />
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
      </div>

      {}
      <div className="relative z-0 h-[340px] w-full md:h-[440px] lg:absolute lg:inset-0 lg:h-auto lg:overflow-hidden">
        <div className="h-full w-full lg:absolute lg:left-0 lg:top-1/2 lg:aspect-[1440/1024] lg:h-auto lg:w-[max(130%,calc(100vh*1440/1024))] lg:-translate-y-1/2">
          <Vortex background="transparent" />
        </div>
        {}
        <div
          className="pointer-events-none absolute inset-x-0 -top-[64px] h-[160px] lg:hidden"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, rgba(10,10,10,0) 0%, #0a0a0a 40%, #0a0a0a 55%, rgba(10,10,10,0) 100%)",
          }}
        />
      </div>

      {}

      {/* decorative polygons */}
      <div className="hidden lg:absolute lg:flex h-[195.131px] items-center justify-center left-[-162px] top-[508px] w-[166.822px]">
        <div className="flex-none rotate-[35.26deg]">
          <div className="h-[189px] relative w-[70.683px]">
            <div className="absolute inset-[-132.28%_-346.99%_-107.28%_-346.99%]">
              <img alt="" className="block max-w-none size-full" src={imgPolygon1} />
            </div>
          </div>
        </div>
      </div>
      <div className="hidden lg:absolute lg:flex h-[192.545px] items-center justify-center right-[-92.25px] top-[-170.71px] w-[171.896px]">
        <div className="-scale-y-100 flex-none rotate-[37.91deg]">
          <div className="h-[189px] relative w-[70.683px]">
            <div className="absolute inset-[-132.28%_-346.99%_-107.28%_-346.99%]">
              <img alt="" className="block max-w-none size-full" src={imgPolygon2} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}