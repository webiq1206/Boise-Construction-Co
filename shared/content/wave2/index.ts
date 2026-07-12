import type { BlogPostData } from '../../blogContent';
import { kitchenRemodelCostBoise } from './kitchen-remodel-cost-boise';
import { bathroomRemodelCostBoise } from './bathroom-remodel-cost-boise';
import { wholeHomeRemodelCostBoise } from './whole-home-remodel-cost-boise';
import { homeAdditionCostBoise } from './home-addition-cost-boise';
import { remodelCostPerSquareFootBoise } from './remodel-cost-per-square-foot-boise';
import { whatImpactsRemodelingCostsBoise } from './what-impacts-remodeling-costs-boise';
import { howToBudgetRemodelBoise } from './how-to-budget-remodel-boise';
import { luxuryRemodelCostBoise } from './luxury-remodel-cost-boise';
import { questionsToAskRemodelingContractor } from './questions-to-ask-remodeling-contractor';
import { remodelingContractorRedFlags } from './remodeling-contractor-red-flags';
import { designBuildVsGeneralContractor } from './design-build-vs-general-contractor';
import { howToCompareRemodelingEstimates } from './how-to-compare-remodeling-estimates';
import { whyRemodelingBidsVary } from './why-remodeling-bids-vary';
import { fixedPriceVsCostPlus } from './fixed-price-vs-cost-plus';
import { kitchenRemodelTimelineBoise } from './kitchen-remodel-timeline-boise';
import { kitchenLayoutIdeasBoiseHomes } from './kitchen-layout-ideas-boise-homes';

/**
 * Wave 2: bespoke, comprehensive blog posts (1,600+ words, Answer-First,
 * unique PAA FAQs, full internal linking) that supersede the thin factory
 * clusters of the same slug. Add each new post here as it is authored.
 */
export const WAVE2_POSTS: BlogPostData[] = [
  // Costs hub
  kitchenRemodelCostBoise,
  bathroomRemodelCostBoise,
  wholeHomeRemodelCostBoise,
  homeAdditionCostBoise,
  remodelCostPerSquareFootBoise,
  whatImpactsRemodelingCostsBoise,
  howToBudgetRemodelBoise,
  luxuryRemodelCostBoise,
  // Contractor Selection hub
  questionsToAskRemodelingContractor,
  remodelingContractorRedFlags,
  designBuildVsGeneralContractor,
  howToCompareRemodelingEstimates,
  whyRemodelingBidsVary,
  fixedPriceVsCostPlus,
  // Kitchen hub
  kitchenRemodelTimelineBoise,
  kitchenLayoutIdeasBoiseHomes,
];
