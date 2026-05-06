import type { Vector3 } from "../types/Vector3"
import type { PlacedCrate } from "../types/PlacedCrate"
import type { AnchorFace } from "../types/CargoBay"
import { checkCollision } from "./checkCollision"
import { checkSupport } from "./checkSupport"
import { getRotations } from "./getRotatedDimensions"
import {
  getFloorBaySize,
  transformPosToFloor,
  transformDimToFloor,
  untransformFromFloor,
} from "./anchorTransform"

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
  anchorFace?: AnchorFace
}

type FloorCrate = { id: string; bayId: string; gridPosition: Vector3; dimensions: Vector3 }

function findBestPositionInFloorSpace(
  crate: { id: string; dimensions: Vector3 },
  floorBaySize: Vector3,
  bayId: string,
  floorPlaced: FloorCrate[],
  startY: number
): { position: Vector3; dimensions: Vector3 } | null {
  const rotations = getRotations(crate.dimensions)

  for (const dims of rotations) {
    const maxX = floorBaySize.x - dims.x
    const maxY = floorBaySize.y - dims.y
    const maxZ = floorBaySize.z - dims.z

    if (maxX < 0 || maxY < 0 || maxZ < 0) continue

    for (let y = maxY; y >= startY; y--)
      for (let x = 0; x <= maxX; x++)
        for (let z = 0; z <= maxZ; z++) {
          const position = { x, y, z }
          if (checkCollision({ id: crate.id, dimensions: dims }, { ...position, bayId }, floorPlaced)) continue
          if (!checkSupport({ id: crate.id, dimensions: dims }, position, floorPlaced, bayId)) continue
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
  const anchor = bay.anchorFace ?? "floor"
  const floorSize = getFloorBaySize(anchor, bay.size)

  const toFloorCrate = (c: { id: string; bayId: string; gridPosition: Vector3; dimensions: Vector3 }): FloorCrate => ({
    id: c.id,
    bayId: c.bayId,
    gridPosition: transformPosToFloor(c.gridPosition, c.dimensions, anchor, bay.size),
    dimensions: transformDimToFloor(c.dimensions, anchor),
  })

  const floorAlready: FloorCrate[] = alreadyPlaced.map(toFloorCrate)
  const floorAccum: FloorCrate[] = []
  const result: Array<PlacedCrate & CrateToPlace> = []

  for (const crate of crates) {
    const floorDim = transformDimToFloor(crate.dimensions, anchor)
    const found = findBestPositionInFloorSpace(
      { id: crate.id, dimensions: floorDim },
      floorSize,
      bay.id,
      [...floorAlready, ...floorAccum],
      startY
    )
    if (!found) continue

    const { pos: gamePos, dim: gameDim } = untransformFromFloor(found.position, found.dimensions, anchor, bay.size)

    result.push({
      ...crate,
      dimensions: gameDim,
      sizeScu: crate.size,
      bayId: bay.id,
      gridPosition: gamePos,
    })

    floorAccum.push({
      id: crate.id,
      bayId: bay.id,
      gridPosition: found.position,
      dimensions: found.dimensions,
    })
  }

  return result
}
