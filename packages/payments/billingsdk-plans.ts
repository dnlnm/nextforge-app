export interface PlanFeature {
  icon: string;
  iconColor?: string;
  name: string;
}

export interface Plan {
  badge?: string;
  buttonText: string;
  currency?: string;
  description: string;
  features: PlanFeature[];
  highlight?: boolean;
  id: string;
  monthlyPrice: string;
  title: string;
  type?: "monthly" | "yearly";
  yearlyPrice: string;
}

export interface CurrentPlan {
  nextBillingDate: string;
  paymentMethod: string;
  plan: Plan;
  price?: string;
  status: "active" | "inactive" | "past_due" | "cancelled";
  type: "monthly" | "yearly" | "custom";
}

const planColumns = (
  students: number,
  teachers: number,
  classes: number,
  invoices: number
): PlanFeature[] => [
  { name: `${students} Students`, icon: "check", iconColor: "text-green-500" },
  { name: `${teachers} Teachers`, icon: "check", iconColor: "text-blue-500" },
  { name: `${classes} Classes`, icon: "check", iconColor: "text-purple-500" },
  {
    name: `${invoices} Invoices per month`,
    icon: "check",
    iconColor: "text-orange-500",
  },
];

export const billingSDKPlans: Plan[] = [
  {
    id: "TRIAL",
    title: "Trial",
    description: "Free 14-day trial to explore the full workflow.",
    currency: "RM",
    monthlyPrice: "0",
    yearlyPrice: "0",
    buttonText: "Trial",
    features: planColumns(20, 5, 5, 20),
  },
  {
    id: "STARTER",
    title: "Starter",
    description: "Perfect for small tuition centres just getting started.",
    currency: "RM",
    monthlyPrice: "49",
    yearlyPrice: "49",
    buttonText: "Upgrade to Starter",
    badge: "Most Popular",
    highlight: true,
    features: planColumns(50, 10, 20, 50),
  },
  {
    id: "PRO",
    title: "Pro",
    description: "For growing tuition centres with more advanced needs.",
    currency: "RM",
    monthlyPrice: "99",
    yearlyPrice: "99",
    buttonText: "Upgrade to Pro",
    features: planColumns(300, 30, 60, 300),
  },
  {
    id: "MAX",
    title: "Max",
    description: "For established centres with the largest workloads.",
    currency: "RM",
    monthlyPrice: "199",
    yearlyPrice: "199",
    buttonText: "Upgrade to Max",
    features: planColumns(500, 100, 200, 1000),
  },
];
