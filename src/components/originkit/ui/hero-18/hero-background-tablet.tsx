"use client";

function asset(file: string) {
  return `/originkit/hero-18/${file}`;
}

const imgDiagonalLines = asset("tablet/diagonal-lines.png");
const imgDiagonalLines1 = asset("tablet/diagonal-lines-1.svg");
const imgElement = asset("tablet/element.svg");
const imgElement1 = asset("tablet/element-1.svg");
const imgElement2 = asset("tablet/element-2.svg");
const imgElement3 = asset("tablet/element-3.svg");
const imgElement4 = asset("tablet/element-4.svg");
const imgElements = asset("tablet/elements.svg");
const imgEllipse = asset("tablet/ellipse.svg");
const imgEllipse1 = asset("tablet/ellipse-1.svg");
const imgPolygon1 = asset("tablet/polygon-1.svg");
const imgPolygon2 = asset("tablet/polygon-2.svg");

export default function HeroBackgroundTablet() {
  return (
    <div
      className="pointer-events-none absolute left-0 top-0 h-[529px] w-[744px]"
      style={{ transform: "scale(max(1, 100vw / 744px))", transformOrigin: "top left" }}
    >
      {}
      <div
        className="absolute bg-size-[3.617px_3.617px] bg-top-left h-[1107px] left-[-107px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[-102.866px_16.133px] mask-size-[536.732px_1009.734px] top-[160px] w-[669px]"
        style={{ backgroundImage: `url("${imgDiagonalLines}")`, maskImage: `url("${imgDiagonalLines1}")` }}
      />
      {}
      <div className="absolute flex h-[1107px] items-center justify-center left-[71px] top-[173px] w-[681px]">
        <div className="-scale-y-100 flex-none rotate-180">
          <div
            className="bg-size-[3.617px_3.617px] bg-top-left h-[1107px] mask-alpha mask-intersect mask-no-clip mask-no-repeat relative w-[681px]"
            style={{
              backgroundImage: `url("${imgDiagonalLines}")`,

              maskImage: `url("${imgDiagonalLines1}"), linear-gradient(to right, black 0%, black calc(100% - 60px), transparent 100%)`,
              maskSize: "536.732px 1009.734px, 100% 100%",
              maskPosition: "235.134px 16.133px, 0 0",
            }}
          />
        </div>
      </div>

      {}
      <div className="absolute left-0 top-0 h-[529.067px] w-[744px]">
        <div className="-scale-y-100 flex-none rotate-180 h-full w-full">
          <div className="drop-shadow-[0px_2.067px_3.617px_rgba(0,0,0,0.25)] h-[529.067px] overflow-clip relative w-[744px]">
            <div className="absolute contents left-[-152.32px] top-[-293.22px]">
              <div className="absolute contents left-[154.98px] size-[964.4px] top-[-381.7px]">
                <div className="absolute flex items-center justify-center left-[496.83px] size-[622.546px] top-[-381.7px]">
                  <div className="flex-none rotate-45">
                    <div
                      className="h-[458.582px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[71.736px_88.48px] mask-size-[1199.962px_1199.959px] relative w-[421.832px]"
                      style={{ maskImage: `url("${imgElement}")` }}
                    >
                      <div className="absolute inset-[-29.85%_-32.46%]">
                        <img alt="" className="block max-w-none size-full" src={imgElement1} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute flex h-[530.617px] items-center justify-center left-[239.48px] mix-blend-plus-lighter top-[-98.67px] w-[514.393px]">
                  <div className="flex-none rotate-[43.56deg] skew-x-[-0.22deg]">
                    <div
                      className="bg-gradient-to-b blur-[7.907px] from-[#52ae54] h-[647.674px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[-293.764px_-194.543px] mask-size-[1199.962px_1199.959px] opacity-30 relative to-[80%] to-[rgba(82,174,84,0)] w-[91.435px]"
                      style={{ maskImage: `url("${imgElement}")` }}
                    />
                  </div>
                </div>
                <div className="absolute flex h-[517.307px] items-center justify-center left-[274.29px] mix-blend-plus-lighter top-[-50.48px] w-[527.863px]">
                  <div className="flex-none rotate-[45.93deg] skew-x-[0.14deg]">
                    <div
                      className="bg-gradient-to-b blur-[13.965px] from-[#52ae54] h-[647.689px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[-245.487px_-242.739px] mask-size-[1199.962px_1199.959px] opacity-80 relative to-[88%] to-[rgba(82,174,84,0)] w-[91.432px]"
                      style={{ maskImage: `url("${imgElement}")` }}
                    />
                  </div>
                </div>
                <div className="absolute flex h-[502.328px] items-center justify-center left-[314.33px] top-[-1.81px] w-[541.35px]">
                  <div className="flex-none rotate-[48.45deg] skew-x-[0.52deg]">
                    <div
                      className="bg-[rgba(82,174,84,0)] blur-[8.18px] h-[647.549px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[-191.964px_-291.407px] mask-size-[1199.962px_1199.959px] opacity-30 relative w-[91.455px]"
                      style={{ maskImage: `url("${imgElement}")` }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute contents left-[154.98px] size-[964.4px] top-[-381.7px]">
              <div className="absolute flex items-center justify-center left-[496.83px] size-[622.546px] top-[-381.7px]">
                <div className="flex-none rotate-45">
                  <div className="h-[458.582px] relative w-[421.832px]">
                    <div className="absolute inset-[-29.85%_-32.46%]">
                      <img alt="" className="block max-w-none size-full" src={imgElement1} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute flex h-[530.617px] items-center justify-center left-[239.49px] mix-blend-plus-lighter top-[-98.68px] w-[514.393px]">
                <div className="flex-none rotate-[43.56deg] skew-x-[-0.22deg]">
                  <div className="bg-gradient-to-b blur-[7.907px] from-[#52ae54] h-[647.674px] opacity-30 relative to-[80%] to-[rgba(82,174,84,0)] w-[91.435px]" />
                </div>
              </div>
              <div className="absolute flex h-[517.307px] items-center justify-center left-[298.12px] top-[-52.7px] w-[527.863px]">
                <div className="flex-none rotate-[45.93deg] skew-x-[0.14deg]">
                  <div
                    className="blur-[13.965px] h-[647.689px] opacity-51 relative w-[91.432px]"
                    style={{
                      backgroundImage:
                        "linear-gradient(179.20787261703023deg, rgb(82, 174, 84) 23.065%, rgba(82, 174, 84, 0.737) 14.923%, rgba(82, 174, 84, 0.307) 51.616%, rgba(82, 174, 84, 0) 99.903%)",
                    }}
                  />
                </div>
              </div>
              <div className="absolute flex h-[502.328px] items-center justify-center left-[314.33px] top-[-1.81px] w-[541.35px]">
                <div className="flex-none rotate-[48.45deg] skew-x-[0.52deg]">
                  <div className="bg-[rgba(82,174,84,0)] blur-[8.18px] h-[647.549px] opacity-30 relative w-[91.455px]" />
                </div>
              </div>
              <div className="absolute flex items-center justify-center left-[480.53px] mix-blend-plus-lighter size-[308.491px] top-[15.17px]">
                <div className="flex-none rotate-45">
                  <div className="h-[436.272px] relative w-0">
                    <div className="absolute inset-[-3.06%_-14.7px]">
                      <img alt="" className="block max-w-none size-full" src={imgElement2} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute flex items-center justify-center left-[375.76px] mix-blend-plus-lighter size-[308.491px] top-[-58.98px]">
                <div className="flex-none rotate-45">
                  <div className="h-[436.272px] relative w-0">
                    <div className="absolute inset-[-3.06%_-14.7px]">
                      <img alt="" className="block max-w-none size-full" src={imgElement2} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute flex items-center justify-center left-[447.63px] mix-blend-plus-lighter size-[230.949px] top-[37.39px]">
                <div className="flex-none rotate-45">
                  <div className="h-[326.612px] relative w-0">
                    <div className="absolute inset-[-4.08%_-13.67px]">
                      <img alt="" className="block max-w-none size-full" src={imgElement3} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute contents left-[-123.77px] size-[1010.405px] top-[-454.82px]">
              <div className="absolute flex items-center justify-center left-[241.69px] size-[644.942px] top-[-454.82px]">
                <div className="flex-none rotate-45">
                  <div className="h-[490.254px] opacity-30 relative w-[421.832px]">
                    <div className="absolute inset-[-27.93%_-32.46%]">
                      <img alt="" className="block max-w-none size-full" src={imgElement4} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute flex h-[562.128px] items-center justify-center left-[-39.26px] mix-blend-plus-lighter top-[-157.42px] w-[546.128px]">
                <div className="flex-none rotate-[43.47deg] skew-x-[-0.4deg]">
                  <div className="bg-gradient-to-b blur-[7.75px] from-[#52ae54] h-[692.387px] opacity-9 relative to-[88%] to-[rgba(82,174,84,0)] w-[91.439px]" />
                </div>
              </div>
              <div className="absolute flex h-[549.008px] items-center justify-center left-[-4.36px] mix-blend-plus-lighter top-[-109.32px] w-[559.419px]">
                <div className="flex-none rotate-46 skew-x-[0.26deg]">
                  <div className="bg-gradient-to-b blur-[14.467px] from-[#52ae54] h-[692.414px] opacity-24 relative to-[88%] to-[rgba(82,174,84,0)] w-[91.434px]" />
                </div>
              </div>
              <div className="absolute flex h-[534.179px] items-center justify-center left-[35.99px] top-[-60.92px] w-[572.664px]">
                <div className="flex-none rotate-[48.69deg] skew-x-[0.95deg]">
                  <div className="bg-[rgba(82,174,84,0)] blur-[8.267px] h-[692.159px] opacity-9 relative w-[91.479px]" />
                </div>
              </div>
            </div>
            <div className="absolute contents left-[-285.03px] size-[886.303px] top-[-443.15px]">
              <div className="absolute flex items-center justify-center left-[16.74px] size-[584.529px] top-[-443.15px]">
                <div className="flex-none rotate-45">
                  <div className="h-[404.818px] opacity-30 relative w-[421.832px]">
                    <div className="absolute inset-[-33.44%_-32.09%]">
                      <img alt="" className="block max-w-none size-full" src={imgElements} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute flex h-[477.126px] items-center justify-center left-[-200.52px] mix-blend-plus-lighter top-[-184.54px] w-[460.522px]">
                <div className="flex-none rotate-[43.73deg] skew-x-[0.11deg]">
                  <div
                    className="blur-[20.667px] h-[571.778px] opacity-24 relative w-[91.428px]"
                    style={{
                      backgroundImage:
                        "linear-gradient(180.31009559830392deg, rgb(82, 174, 84) 38.81%, rgba(82, 174, 84, 0) 72.523%)",
                    }}
                  />
                </div>
              </div>
              <div className="absolute flex h-[463.495px] items-center justify-center left-[-165.87px] top-[-136.18px] w-[474.298px]">
                <div className="flex-none rotate-[45.82deg] skew-x-[-0.07deg]">
                  <div className="bg-[rgba(82,174,84,0)] blur-[20.667px] h-[571.77px] opacity-24 relative w-[91.429px]" />
                </div>
              </div>
              <div className="absolute flex h-[448.259px] items-center justify-center left-[-126.37px] top-[-87.06px] w-[488.195px]">
                <div className="flex-none rotate-[48.05deg] skew-x-[-0.27deg]">
                  <div className="bg-[rgba(82,174,84,0)] blur-[8.18px] h-[571.842px] opacity-9 relative w-[91.419px]" />
                </div>
              </div>
            </div>
            <div className="absolute flex items-center justify-center left-[-65.32px] mix-blend-plus-lighter size-[497.673px] top-[-139.32px]">
              <div className="flex-none rotate-45">
                <div className="h-[640.686px] relative w-[63.13px]">
                  <div className="absolute inset-[-8.06%_-81.84%]">
                    <img alt="" className="block max-w-none size-full" src={imgEllipse} />
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute flex items-center justify-center left-[180.79px] mix-blend-plus-lighter size-[497.673px] top-[-183.96px]">
              <div className="flex-none rotate-45">
                <div className="h-[640.686px] relative w-[63.13px]">
                  <div className="absolute inset-[-3.71%_-37.65%]">
                    <img alt="" className="block max-w-none size-full" src={imgEllipse1} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="absolute flex h-[283.684px] items-center justify-center right-[-125.26px] top-[-261.51px] w-[253.261px]">
        <div className="-scale-y-100 flex-none rotate-[37.91deg]">
          <div className="h-[278.462px] relative w-[104.141px]">
            <div className="absolute inset-[-132.28%_-346.99%_-107.28%_-346.99%]">
              <img alt="" className="block max-w-none size-full" src={imgPolygon2} />
            </div>
          </div>
        </div>
      </div>
      <div className="absolute flex h-[100.818px] items-center justify-center left-[-81px] top-[430px] w-[86.192px]">
        <div className="flex-none rotate-[35.26deg]">
          <div className="h-[97.65px] relative w-[36.52px]">
            <div className="absolute inset-[-132.28%_-346.99%_-107.28%_-346.99%]">
              <img alt="" className="block max-w-none size-full" src={imgPolygon1} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}