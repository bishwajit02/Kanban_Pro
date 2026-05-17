import React from "react";
import { FaSearch, FaFilter } from "react-icons/fa";
import Input from "./ui/Input";
import Button from "./ui/Button";

const BoardFilters = ({
  searchTerm,
  setSearchTerm,
  showFilters,
  setShowFilters,
}) => {
  return (
    <div className="flex flex-col md:flex-row items-center gap-4">
      <div className="flex-1 w-full">
        <Input
          placeholder="Search across all tasks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={FaSearch}
          className="py-3.5 rounded-2xl shadow-sm"
        />
      </div>
      <Button
        variant={showFilters ? "primary" : "secondary"}
        leftIcon={FaFilter}
        onClick={() => setShowFilters(!showFilters)}
        className="rounded-2xl py-3.5 px-8"
      >
        Filters
      </Button>
    </div>
  );
};

export default BoardFilters;
