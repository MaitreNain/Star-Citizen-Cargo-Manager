import type { Vector3 } from "../types/Vector3"
import type { PlacedCrate } from "../types/PlacedCrate"
import { checkCollision } from "./checkCollision"
import { checkSupport } from "./checkSupport"

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
}

function doesCrateFit(
  baySize: Vector3,
  crateSize: Vector3,
  position: Vector3
): boolean {
  return (
    position.x + crateSize.x <= baySize.x &&
    position.y + crateSize.y <= baySize.y &&
    position.z + crateSize.z <= baySize.z
  )
}

function getRotations(dimensions: Vector3): Vector3[] {
  const { x, y, z } = dimensions
  if (x === y) return [{ x, y, z }]
  return [
    { x, y, z },
    { x: y, y: x, z },
  ]
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

  for (const dims of rotations) {

    const maxX = bay.size.x - dims.x
    const maxY = bay.size.y - dims.y
    const maxZ = bay.size.z - dims.z

    if (maxX < 0 || maxY < 0 || maxZ < 0) continue

    // On part du fond (maxY) mais jamais en dessous de startY
    for (let y = maxY; y >= startY; y--) {

      for (let x = 0; x <= maxX; x++) {

        for (let z = 0; z <= maxZ; z++) {

          const position = { x, y, z }

          if (!doesCrateFit(bay.size, dims, position)) continue

          const collides = checkCollision(
            { id: crate.id, dimensions: dims },
            { ...position, bayId: bay.id },
            alreadyPlaced
          )
          if (collides) continue

          const supported = checkSupport(
            { id: crate.id, dimensions: dims },
            position,
            alreadyPlaced,
            bay.id
          )
          if (!supported) continue

          return { position, dimensions: dims }
        }
      }
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

    const result = findBestStackPosition(
      crate,
      bay,
      [...alreadyPlaced, ...placedCrates],
      startY
    )

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
