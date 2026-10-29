"use client";

function asset(file: string) {
  return `/originkit/hero-18/${file}`;
}

const imgDiagonalLines = asset("mobile/diagonal-lines.png");
const imgDiagonalLines1 = asset("mobile/diagonal-lines-1.svg");
const imgDiagonalLines2 = asset("mobile/diagonal-lines-2.svg");
const imgElement = asset("mobile/element.svg");
const imgElement1 = asset("mobile/element-1.svg");
const imgElement2 = asset("mobile/element-2.svg");
const imgElement3 = asset("mobile/element-3.svg");
const imgElement4 = asset("mobile/element-4.svg");
const imgElements = asset("mobile/elements.svg");
const imgEllipse = asset("mobile/ellipse.svg");
const imgEllipse1 = asset("mobile/ellipse-1.svg");
const imgPolygon1 = asset("mobile/polygon-1.svg");

export default function HeroBackgroundMobile() {
  return (
    <div
      className="pointer-events-none absolute left-0 top-0 h-[387px] w-[544px]"
      style={{ transform: "scale(max(1, 100vw / 544px))", transformOrigin: "top left" }}
    >
      {}
      <div className="absolute flex h-[1107px] items-center justify-center left-[-19px] top-[-7px] w-[681px]">
        <div className="-scale-y-100 flex-none rotate-180">
          <div
            className="bg-size-[3.617px_3.617px] bg-top-left h-[1107px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[235.134px_156.133px] mask-size-[536.733px_869.734px] relative w-[681px]"
            style={{ backgroundImage: `url("${imgDiagonalLines}")`, maskImage: `url("${imgDiagonalLines1}")` }}
          />
        </div>
      </div>
      {}
      <div
        className="absolute bg-size-[3.617px_3.617px] bg-top-left h-[1107px] left-[-107px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[-102.866px_16.133px] mask-size-[536.732px_1009.734px] top-[120px] w-[669px]"
        style={{ backgroundImage: `url("${imgDiagonalLines}")`, maskImage: `url("${imgDiagonalLines2}")` }}
      />

      {}
      <div className="absolute left-0 top-0 h-[386.844px] w-[544px]">
        <div className="-scale-y-100 flex-none rotate-180 h-full w-full">
          <div className="drop-shadow-[0px_1.511px_2.644px_rgba(0,0,0,0.25)] h-[386.844px] overflow-clip relative w-[544px]">
            <div className="absolute contents left-[-111.37px] top-[-214.39px]">
              <div className="absolute contents left-[113.32px] size-[705.154px] top-[-279.09px]">
                <div className="absolute flex items-center justify-center left-[363.28px] size-[455.195px] top-[-279.08px]">
                  <div className="flex-none rotate-45">
                    <div
                      className="h-[335.307px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[52.451px_64.695px] mask-size-[877.391px_877.393px] relative w-[308.436px]"
                      style={{ maskImage: `url("${imgElement}")` }}
                    >
                      <div className="absolute inset-[-29.85%_-32.46%]">
                        <img alt="" className="block max-w-none size-full" src={imgElement1} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute flex h-[387.978px] items-center justify-center left-[175.11px] mix-blend-plus-lighter top-[-72.14px] w-[376.115px]">
                  <div className="flex-none rotate-[43.56deg] skew-x-[-0.22deg]">
                    <div
                      className="bg-gradient-to-b blur-[5.781px] from-[#52ae54] h-[473.568px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[-214.799px_-142.248px] mask-size-[877.391px_877.393px] opacity-30 relative to-[80%] to-[rgba(82,174,84,0)] w-[66.855px]"
                      style={{ maskImage: `url("${imgElement}")` }}
                    />
                  </div>
                </div>
                <div className="absolute flex h-[378.246px] items-center justify-center left-[200.56px] mix-blend-plus-lighter top-[-36.9px] w-[385.965px]">
                  <div className="flex-none rotate-[45.93deg] skew-x-[0.14deg]">
                    <div
                      className="bg-gradient-to-b blur-[10.211px] from-[#52ae54] h-[473.579px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[-179.495px_-177.486px] mask-size-[877.391px_877.393px] opacity-80 relative to-[88%] to-[rgba(82,174,84,0)] w-[66.854px]"
                      style={{ maskImage: `url("${imgElement}")` }}
                    />
                  </div>
                </div>
                <div className="absolute flex h-[367.293px] items-center justify-center left-[229.83px] top-[-1.32px] w-[395.826px]">
                  <div className="flex-none rotate-[48.45deg] skew-x-[0.52deg]">
                    <div
                      className="bg-[rgba(82,174,84,0)] blur-[5.981px] h-[473.477px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[-140.363px_-213.074px] mask-size-[877.391px_877.393px] opacity-30 relative w-[66.871px]"
                      style={{ maskImage: `url("${imgElement}")` }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute contents left-[113.32px] size-[705.154px] top-[-279.09px]">
              <div className="absolute flex items-center justify-center left-[363.28px] size-[455.195px] top-[-279.09px]">
                <div className="flex-none rotate-45">
                  <div className="h-[335.307px] relative w-[308.436px]">
                    <div className="absolute inset-[-29.85%_-32.46%]">
                      <img alt="" className="block max-w-none size-full" src={imgElement1} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute flex h-[387.978px] items-center justify-center left-[175.11px] mix-blend-plus-lighter top-[-72.15px] w-[376.115px]">
                <div className="flex-none rotate-[43.56deg] skew-x-[-0.22deg]">
                  <div className="bg-gradient-to-b blur-[5.781px] from-[#52ae54] h-[473.568px] opacity-30 relative to-[80%] to-[rgba(82,174,84,0)] w-[66.855px]" />
                </div>
              </div>
              <div className="absolute flex h-[378.246px] items-center justify-center left-[217.98px] top-[-38.54px] w-[385.965px]">
                <div className="flex-none rotate-[45.93deg] skew-x-[0.14deg]">
                  <div
                    className="blur-[10.211px] h-[473.579px] opacity-51 relative w-[66.854px]"
                    style={{
                      backgroundImage:
                        "linear-gradient(179.20787259385162deg, rgb(82, 174, 84) 23.065%, rgba(82, 174, 84, 0.737) 14.923%, rgba(82, 174, 84, 0.307) 51.616%, rgba(82, 174, 84, 0) 99.903%)",
                    }}
                  />
                </div>
              </div>
              <div className="absolute flex h-[367.293px] items-center justify-center left-[229.83px] top-[-1.32px] w-[395.826px]">
                <div className="flex-none rotate-[48.45deg] skew-x-[0.52deg]">
                  <div className="bg-[rgba(82,174,84,0)] blur-[5.981px] h-[473.477px] opacity-30 relative w-[66.871px]" />
                </div>
              </div>
              <div className="absolute flex items-center justify-center left-[351.36px] mix-blend-plus-lighter size-[225.563px] top-[11.09px]">
                <div className="flex-none rotate-45">
                  <div className="h-[318.995px] relative w-0">
                    <div className="absolute inset-[-3.06%_-10.75px]">
                      <img alt="" className="block max-w-none size-full" src={imgElement2} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute flex items-center justify-center left-[274.75px] mix-blend-plus-lighter size-[225.563px] top-[-43.12px]">
                <div className="flex-none rotate-45">
                  <div className="h-[318.995px] relative w-0">
                    <div className="absolute inset-[-3.06%_-10.75px]">
                      <img alt="" className="block max-w-none size-full" src={imgElement2} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute flex items-center justify-center left-[327.3px] mix-blend-plus-lighter size-[168.866px] top-[27.34px]">
                <div className="flex-none rotate-45">
                  <div className="h-[238.813px] relative w-0">
                    <div className="absolute inset-[-4.08%_-10px]">
                      <img alt="" className="block max-w-none size-full" src={imgElement3} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute contents left-[-90.5px] size-[738.79px] top-[-332.56px]">
              <div className="absolute flex items-center justify-center left-[176.72px] size-[471.57px] top-[-332.56px]">
                <div className="flex-none rotate-45">
                  <div className="h-[358.465px] opacity-30 relative w-[308.436px]">
                    <div className="absolute inset-[-27.93%_-32.46%]">
                      <img alt="" className="block max-w-none size-full" src={imgElement4} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute flex h-[411.019px] items-center justify-center left-[-28.71px] mix-blend-plus-lighter top-[-115.1px] w-[399.319px]">
                <div className="flex-none rotate-[43.47deg] skew-x-[-0.4deg]">
                  <div className="bg-gradient-to-b blur-[5.667px] from-[#52ae54] h-[506.261px] opacity-9 relative to-[88%] to-[rgba(82,174,84,0)] w-[66.858px]" />
                </div>
              </div>
              <div className="absolute flex h-[401.425px] items-center justify-center left-[-3.19px] mix-blend-plus-lighter top-[-79.93px] w-[409.037px]">
                <div className="flex-none rotate-46 skew-x-[0.26deg]">
                  <div className="bg-gradient-to-b blur-[10.578px] from-[#52ae54] h-[506.281px] opacity-24 relative to-[88%] to-[rgba(82,174,84,0)] w-[66.855px]" />
                </div>
              </div>
              <div className="absolute flex h-[390.583px] items-center justify-center left-[26.31px] top-[-44.54px] w-[418.722px]">
                <div className="flex-none rotate-[48.69deg] skew-x-[0.95deg]">
                  <div className="bg-[rgba(82,174,84,0)] blur-[6.044px] h-[506.095px] opacity-9 relative w-[66.888px]" />
                </div>
              </div>
            </div>
            <div className="absolute contents left-[-208.41px] size-[648.05px] top-[-324.03px]">
              <div className="absolute flex items-center justify-center left-[12.25px] size-[427.398px] top-[-324.03px]">
                <div className="flex-none rotate-45">
                  <div className="h-[295.996px] opacity-30 relative w-[308.436px]">
                    <div className="absolute inset-[-33.44%_-32.09%]">
                      <img alt="" className="block max-w-none size-full" src={imgElements} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute flex h-[348.867px] items-center justify-center left-[-146.61px] mix-blend-plus-lighter top-[-134.94px] w-[336.726px]">
                <div className="flex-none rotate-[43.73deg] skew-x-[0.11deg]">
                  <div
                    className="blur-[15.111px] h-[418.074px] opacity-24 relative w-[66.851px]"
                    style={{
                      backgroundImage:
                        "linear-gradient(180.3100955887092deg, rgb(82, 174, 84) 38.81%, rgba(82, 174, 84, 0) 72.523%)",
                    }}
                  />
                </div>
              </div>
              <div className="absolute flex h-[338.899px] items-center justify-center left-[-121.28px] top-[-99.58px] w-[346.798px]">
                <div className="flex-none rotate-[45.82deg] skew-x-[-0.07deg]">
                  <div className="bg-[rgba(82,174,84,0)] blur-[15.111px] h-[418.068px] opacity-24 relative w-[66.852px]" />
                </div>
              </div>
              <div className="absolute flex h-[327.759px] items-center justify-center left-[-92.4px] top-[-63.66px] w-[356.96px]">
                <div className="flex-none rotate-[48.05deg] skew-x-[-0.27deg]">
                  <div className="bg-[rgba(82,174,84,0)] blur-[5.981px] h-[418.121px] opacity-9 relative w-[66.844px]" />
                </div>
              </div>
            </div>
            <div className="absolute flex items-center justify-center left-[-47.76px] mix-blend-plus-lighter size-[363.89px] top-[-101.86px]">
              <div className="flex-none rotate-45">
                <div className="h-[468.458px] relative w-[46.16px]">
                  <div className="absolute inset-[-8.06%_-81.84%]">
                    <img alt="" className="block max-w-none size-full" src={imgEllipse} />
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute flex items-center justify-center left-[132.19px] mix-blend-plus-lighter size-[363.89px] top-[-134.51px]">
              <div className="flex-none rotate-45">
                <div className="h-[468.458px] relative w-[46.16px]">
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
      <div className="absolute flex h-[53.91px] items-center justify-center left-[-99.25px] top-[343.45px] w-[102.712px]">
        <div className="flex-none rotate-[79.37deg]">
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