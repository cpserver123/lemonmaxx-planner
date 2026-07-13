import { RxDashboard } from "react-icons/rx";
import { LuTrendingUp } from "react-icons/lu";
import { GiGiftOfKnowledge } from "react-icons/gi";

export const NAV_DATA = [
  {
    label: "MAIN MENU",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: RxDashboard,
        items: [],
      },
      // {
      //   title: "Performance Tracking",
      //   url: "/performance_tracking",
      //   icon: LuTrendingUp,
      //   items: [],
      // },
      {
        title: "Knowledge Bank",
        url: "/knowledge_bank",
        icon: GiGiftOfKnowledge,
        items: [],
      },
    ],
  },
];

