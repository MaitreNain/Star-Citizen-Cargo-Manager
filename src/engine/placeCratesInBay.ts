import type { Vector3 } from "../types/Vector3"
import type { PlacedCrate } from "../types/PlacedCrate"
import { checkCollision } from "./checkCollision"
import { checkSupport } from "./checkSupport"
import { getRotations } from "./getRotatedDimensions"

type CrateToPlace = {
  id: string
  size: number
  dimensions: Vector3
  contractId?: string
  contractName?: string
  destination?: string
  commodity?: string
  color?: string
}

type CargoBayLike = {
  id: string
  size: Vector3
  anchorFace?: "floor" | "ceiling"
}

/**
 * startY : profondeur minimale de départ (fond = maxY, rampe = 0).
 * En mode séparé, on passe la profondeur après l'espace vide réservé.
 */
function findBestStackPosition(
  crate: CrateToPlace,
  bay: CargoBayLike,
  alreadyPlaced: Array<PlacedCrate & Partial<CrateToPlace>>,
  startY: number = 0
): { position: Vector3; dimensions: Vector3 } | null {
  const rotations = getRotations(crate.dimensions)

  const anchor = bay.anchorFace ?? "floor"

  for (const dims of rotations) {
    const maxX = bay.size.x - dims.x
    const maxY = bay.size.y - dims.y
    const maxZ = bay.size.z - dims.z

    if (maxX < 0 || maxY < 0 || maxZ < 0) continue

    // On part du fond (maxY) mais jamais en dessous de startY
    for (let y = maxY; y >= startY; y--)
      for (let x = 0; x <= maxX; x++)
        for (let zi = 0; zi <= maxZ; zi++) {
          const z = anchor === "ceiling" ? maxZ - zi : zi
          const position = { x, y, z }
          if (checkCollision({ id: crate.id, dimensions: dims }, { ...position, bayId: bay.id }, alreadyPlaced)) continue
          if (!checkSupport({ id: crate.id, dimensions: dims }, position, alreadyPlaced, bay.id, anchor, bay.size.z)) continue
          return { position, dimensions: dims }
        }
  }

  return null
}

export function placeCratesInBay(
  crates: CrateToPlace[],
  bay: CargoBayLike,
  alreadyPlaced: Array<PlacedCrate & Partial<CrateToPlace>> = [],
  startY: number = 0
): Array<PlacedCrate & CrateToPlace> {
  const placedCrates: Array<PlacedCrate & CrateToPlace> = []

  for (const crate of crates) {
    const result = findBestStackPosition(crate, bay, [...alreadyPlaced, ...placedCrates], startY)
    if (!result) continue
    placedCrates.push({
      ...crate,
      dimensions: result.dimensions,
      sizeScu: crate.size,
      bayId: bay.id,
      gridPosition: result.position
    })
  }

  return placedCrates
}
