import React from "react";
import UploadZone from "../components/UploadContent"; 

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="px-5 py-5 mx-auto max-w-5xl sm:px-10 lg:px-15">
          <h1 className="text-2xl font-bold text-gray-500">My Personal Study Guide Gen.</h1>
        </div>
      </header>

      <main className="px-5 py-10 mx-auto max-w-7xl sm:px-10 lg:px-15">
        {/* Uploading PDF Content Component*/}
        <div className="mb-10">
          <h2 className="mb-5 text-xl font-semibold text-gray-500">Upload Course Material</h2>
          <UploadZone />
        </div>

        {/* Practice Component and reading panes */}
        <div className="p-5 bg-white border border-gray-300 rounded-xl">
          <h2 className="mb-5 text-lg font-semibold text-gray-500">Study Space</h2>
          <p className="text-gray-500">Upload PDF to generate summaries and practice questions</p>
        </div>
      </main>
    </div>
  );
}