import { useMemo, useState } from "react";
import type { Brand } from "@/types/brand";

interface UseBrandsTableMockParams {
  initialBrands?: Brand[];
}

export const useBrandsTableMock = ({
  initialBrands,
}: UseBrandsTableMockParams) => {
  const [searchValue, setSearchValue] = useState("");

  const sourceBrands = initialBrands ?? [];

  const brands = useMemo(() => {
    if (!searchValue) return sourceBrands;
    const q = searchValue.toLowerCase();
    return sourceBrands.filter((b) => b.name.toLowerCase().includes(q));
  }, [searchValue, sourceBrands]);

  return {
    brands,
    searchValue,
    setSearchValue,
  };
};
