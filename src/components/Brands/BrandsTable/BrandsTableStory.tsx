import React from "react";

import type { Brand } from "@/types/brand";
import { useBrandsTableMock } from "./useBrandsTableMock";
import { BrandsTablePresentation } from "./BrandsTablePresentation";

export interface BrandsTableStoryProps {
  initialBrands?: Brand[];
  showBackButton?: boolean;
}

export const BrandsTableStory: React.FC<BrandsTableStoryProps> = ({
  initialBrands,
  showBackButton,
}) => {
  const { brands, searchValue, setSearchValue } = useBrandsTableMock({
    initialBrands: initialBrands ?? [],
  });

  return (
    <BrandsTablePresentation
      title="Brands"
      brands={brands}
      searchPlaceholder="Search brands..."
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      showBackButton={showBackButton}
      onBackClick={() => undefined}
      pagination={{ pageSize: 10 }}
    />
  );
};
