import { initGdpEmissionsModule } from "./modules/gdp-emissions.js?v=20260510-devtype-filter";
import { initPolicyTimelineModule } from "./modules/policy-timeline.js?v=20260510-policy-insight";
import { initTradeCarbonModule } from "./modules/trade-carbon.js";
import { initCarbonMajorsModule } from "./modules/carbon-majors.js";

document.addEventListener("DOMContentLoaded", async () => {
  await Promise.all([
    initGdpEmissionsModule(),
    initPolicyTimelineModule(),
    initTradeCarbonModule(),
    initCarbonMajorsModule()
  ]);
});
