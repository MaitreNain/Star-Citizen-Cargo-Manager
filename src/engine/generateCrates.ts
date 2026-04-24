const CONTAINER_SIZES = [32, 24, 16, 8, 4, 2, 1];

export function generateCrates(totalScu: number, maxSize: number) {

  const sizes = CONTAINER_SIZES.filter(s => s <= maxSize);

  const crates: number[] = [];

  let remaining = totalScu;

  for (const size of sizes) {

    while (remaining >= size) {
      crates.push(size);
      remaining -= size;
    }

  }

  return crates;
}