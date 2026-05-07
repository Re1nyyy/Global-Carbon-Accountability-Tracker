import { initGdpEmissionsModule } from "./modules/gdp-emissions.js";
import { initPolicyTimelineModule } from "./modules/policy-timeline.js";
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
