import React, { useState } from "react";
import type { NextPage } from "next";
import Sidebar from "@components/Sidebar";
import Header from "@components/Header";
import ChartCard from "@components/ChartCard";
import TrendingCard from "@components/TrendingCard";
import WatchlistCard from "@components/WatchlistCard";
import NewsCard from "@components/NewsCard";


const Home: NextPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      {/* <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} /> */}

      {/* Content area */}
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        {/*  Site header */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main>
          <div className="px-4 sm:px-6 lg:px-8 py-4 w-full max-w-9xl mx-auto">
            <div className="grid grid-cols-12 gap-6">
              <WatchlistCard />
              <TrendingCard />
              <ChartCard />
              <NewsCard />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Home;
