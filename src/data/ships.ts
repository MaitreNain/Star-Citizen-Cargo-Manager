import type { Ship } from "../types/Ship";

export const ships: Ship[] = [
  {
    id: "a2-hercules-starlifter",
    name: "A2 Hercules",
    cargoBays: [
      {
        id: "a2-bay-1",
        name: "Soute 1",
        size: { x: 6, y: 18, z: 2 },
        offset: { x: 0, y: 0, z: 0 },
      },
    ],
  },

  {
    id: "argo-raft",
    name: "Argo RAFT",
    cargoBays: [
      {
        id: "raft-bay-1",
        name: "Soute principale",
        size: { x: 8, y: 12, z: 2 },
        offset: { x: 0, y: 0, z: 0 },
        anchorFace: "ceiling",
      },
    ],
  },

  {
    id: "asgard",
    name: "Asgard",
    cargoBays: [
      {
        id: "asgard-bay-1",
        name: "Soute 1",
        size: { x: 5, y: 9, z: 4 },
        offset: { x: 0, y: 0, z: 0 },
      },
    ],
  },

  {
    id: "c1-spirit",
    name: "C1 Spirit",
    cargoBays: [
      {
        id: "c1-bay-1",
        name: "Soute 1",
        size: { x: 2, y: 8, z: 2 },
        offset: { x: 4, y: 9, z: 0 },
      },
      {
        id: "c1-bay-2",
        name: "Soute 2",
        size: { x: 2, y: 8, z: 2 },
        offset: { x: 0, y: 9, z: 0 },
      },
    ],
  },

  {
    id: "c2-hercules-starlifter",
    name: "C2 Hercules",
    cargoBays: [
      {
        id: "c2-bay-1",
        name: "Soute 1",
        size: { x: 8, y: 15, z: 4 },
        offset: { x: 0, y: -7, z: 0 },
      },
      {
        id: "c2-bay-2",
        name: "Soute 2",
        size: { x: 6, y: 9, z: 4 },
        offset: { x: 1, y: 9, z: 0 },
      },
    ],
  },

  {
    id: "carrack",
    name: "Carrack",
    cargoBays: [
      { id: "m1-a", name: "Module 1 - A", size: { x: 4, y: 4, z: 4 }, offset: { x: 0, y: 0, z: 0 } },
      { id: "m1-b", name: "Module 1 - B", size: { x: 4, y: 3, z: 2 }, offset: { x: 5, y: 0, z: 0 } },
      { id: "m1-c", name: "Module 1 - C", size: { x: 4, y: 4, z: 4 }, offset: { x: 10, y: 0, z: 0 } },

      { id: "m2-a", name: "Module 2 - A", size: { x: 4, y: 4, z: 4 }, offset: { x: 0, y: 6, z: 0 } },
      { id: "m2-b", name: "Module 2 - B", size: { x: 4, y: 3, z: 2 }, offset: { x: 5, y: 6, z: 0 } },
      { id: "m2-c", name: "Module 2 - C", size: { x: 4, y: 4, z: 4 }, offset: { x: 10, y: 6, z: 0 } },

      { id: "m3-a", name: "Module 3 - A", size: { x: 4, y: 4, z: 4 }, offset: { x: 0, y: 12, z: 0 } },
      { id: "m3-b", name: "Module 3 - B", size: { x: 4, y: 3, z: 2 }, offset: { x: 5, y: 12, z: 0 } },
      { id: "m3-c", name: "Module 3 - C", size: { x: 4, y: 4, z: 4 }, offset: { x: 10, y: 12, z: 0 } },
    ],
  },

{
  id: "caterpillar",
  name: "Caterpillar",
  cargoBays: [
    { id: "cat-bay-1", name: "Soute 1a", size: { x: 5, y: 6, z: 2 }, offset: { x: 1, y: 20, z: 0 }, group: "Soute-1" },
    { id: "cat-bay-2", name: "Soute 1b", size: { x: 5, y: 4, z: 1 }, offset: { x: 1, y: 22, z: 2 }, group: "Soute-1" },

    { id: "cat-bay-3", name: "Soute 2a", size: { x: 7, y: 4, z: 2 }, offset: { x: 0, y: 14, z: 0 }, group: "Soute-2" },
    { id: "cat-bay-4", name: "Soute 2b", size: { x: 6, y: 4, z: 2 }, offset: { x: 0, y: 14, z: 2 }, group: "Soute-2" },
    { id: "cat-bay-5", name: "Soute 2c", size: { x: 5, y: 1, z: 4 }, offset: { x: 0, y: 13, z: 0 }, group: "Soute-2" },

    { id: "cat-bay-6", name: "Soute 3a", size: { x: 7, y: 4, z: 2 }, offset: { x: 0, y: 7, z: 0 }, group: "Soute-3" },
    { id: "cat-bay-7", name: "Soute 3b", size: { x: 6, y: 4, z: 2 }, offset: { x: 0, y: 7, z: 2 }, group: "Soute-3" },
    { id: "cat-bay-8", name: "Soute 3c", size: { x: 5, y: 1, z: 4 }, offset: { x: 0, y: 6, z: 0 }, group: "Soute-3" },

    { id: "cat-bay-9", name: "Soute 4a", size: { x: 7, y: 4, z: 2 }, offset: { x: 0, y: 0, z: 0 }, group: "Soute-4" },
    { id: "cat-bay-10", name: "Soute 4b", size: { x: 6, y: 4, z: 2 }, offset: { x: 0, y: 0, z: 2 }, group: "Soute-4" },
    { id: "cat-bay-11", name: "Soute 4c", size: { x: 5, y: 1, z: 4 }, offset: { x: 0, y: -1, z: 0 }, group: "Soute-4" },

    { id: "cat-bay-12", name: "Soute 5a", size: { x: 7, y: 4, z: 2 }, offset: { x: 0, y: -7, z: 0 }, group: "Soute-5" },
    { id: "cat-bay-13", name: "Soute 5b", size: { x: 6, y: 4, z: 2 }, offset: { x: 0, y: -7, z: 2 }, group: "Soute-5" },
    { id: "cat-bay-14", name: "Soute 5c", size: { x: 5, y: 1, z: 4 }, offset: { x: 0, y: -8, z: 0 }, group: "Soute-5" },


  ],
},

  {
    id: "constellation-andromeda",
    name: "Constellation Andromeda",
    cargoBays: [
      {
        id: "andromeda-bay-1",
        name: "Soute 1",
        size: { x: 4, y: 8, z: 3 },
        offset: { x: 0, y: 0, z: 0 },
      },
    ],
  },

  {
    id: "constellation-taurus",
    name: "Constellation Taurus",
    cargoBays: [
      {
        id: "Taurus-bay-1",
        name: "Soute 1",
        size: { x: 4, y: 14, z: 3 },
        offset: { x: 0, y: 0, z: 0 },
      },
    ],
  },

  {
    id: "corsair",
    name: "Corsair",
    cargoBays: [
      {
        id: "corsair-bay-1",
        name: "Soute 1",
        size: { x: 4, y: 6, z: 3 },
        offset: { x: 0, y: 0, z: 0 },
      },
    ],
  },

  {
    id: "cutlass-black",
    name: "Cutlass Black",
    cargoBays: [
      {
        id: "cutlass-black-bay-1",
        name: "Soute 1",
        size: { x: 4, y: 5, z: 2 },
        offset: { x: 0, y: 0, z: 0 },
      },
      {
        id: "cutlass-black-bay-2",
        name: "Soute 2",
        size: { x: 1, y: 3, z: 2 },
        offset: { x: 1, y: 6, z: 0 },
      },
    ],
  },

  {
    id: "freelancer",
    name: "Freelancer",
    cargoBays: [
      {
        id: "freelancer-bay-1",
        name: "Soute 1",
        size: { x: 2, y: 9, z: 3 },
        offset: { x: 0, y: 0, z: 0 },
      },
      {
        id: "freelancer-bay-2",
        name: "Soute 2",
        size: { x: 1, y: 2, z: 3 },
        offset: { x: -1, y: 10, z: 0 },
      },
      {
        id: "freelancer-bay-3",
        name: "Soute 3",
        size: { x: 1, y: 2, z: 3 },
        offset: { x: 2, y: 10, z: 0 },
      },
    ],
  },

  {
    id: "freelancer-dur",
    name: "Freelancer DUR",
    cargoBays: [
      {
        id: "freelancer-dur-bay-1",
        name: "Soute 1",
        size: { x: 2, y: 4, z: 3 },
        offset: { x: 0, y: 0, z: 0 },
      },
      {
        id: "freelancer-dur-bay-2",
        name: "Soute 2",
        size: { x: 1, y: 2, z: 3 },
        offset: { x: -1, y: 5, z: 0 },
      },
      {
        id: "freelancer-dur-bay-3",
        name: "Soute 3",
        size: { x: 1, y: 2, z: 3 },
        offset: { x: 2, y: 5, z: 0 },
      },
    ],
  },

  {
    id: "freelancer-max",
    name: "Freelancer MAX",
    cargoBays: [
      {
        id: "freelancer-max-bay-1",
        name: "Soute 1",
        size: { x: 4, y: 9, z: 3 },
        offset: { x: 0, y: 0, z: 0 },
      },
      {
        id: "freelancer-max-bay-2",
        name: "Soute 2",
        size: { x: 1, y: 2, z: 3 },
        offset: { x: 0, y: 10, z: 0 },
      },
      {
        id: "freelancer-max-bay-3",
        name: "Soute 3",
        size: { x: 1, y: 2, z: 3 },
        offset: { x: 3, y: 10, z: 0 },
      },
    ],
  },

  {
    id: "freelancer-mis",
    name: "Freelancer MIS",
    cargoBays: [
      {
        id: "freelancer-mis-bay-1",
        name: "Soute 1",
        size: { x: 2, y: 4, z: 3 },
        offset: { x: 0, y: 0, z: 0 },
      },
      {
        id: "freelancer-mis-bay-2",
        name: "Soute 2",
        size: { x: 1, y: 2, z: 3 },
        offset: { x: -1, y: 5, z: 0 },
      },
      {
        id: "freelancer-mis-bay-3",
        name: "Soute 3",
        size: { x: 1, y: 2, z: 3 },
        offset: { x: 2, y: 5, z: 0 },
      },
    ],
  },

  {
    id: "golem-ox",
    name: "Golem OX",
    cargoBays: [
      {
        id: "golem-ox-bay-1",
        name: "Soute 1",
        size: { x: 4, y: 8, z: 2 },
        offset: { x: 0, y: 0, z: 0 },
        anchorFace: "ceiling",
      },
    ],
  },

  {
    id: "hermes",
    name: "Hermes",
    cargoBays: [
      {
        id: "hermes-bay-1",
        name: "Soute 1",
        size: { x: 4, y: 18, z: 2 },
        offset: { x: 0, y: 0, z: 0 },
      },
      {
        id: "hermes-bay-2",
        name: "Soute 2",
        size: { x: 4, y: 18, z: 2 },
        offset: { x: 6, y: 0, z: 0 },
      },
    ],
  },

  {
    id: "hull-a",
    name: "Hull A",
    cargoBays: [
      { id: "hull-a-bay-1", name: "Soute 1", size: { x: 2, y: 4, z: 2 }, offset: { x: -3, y: 0, z: 0 }, anchorFace: "right" },
      { id: "hull-a-bay-2", name: "Soute 2", size: { x: 2, y: 4, z: 2 }, offset: { x: -3, y: 0, z: 3 }, anchorFace: "right" },
      { id: "hull-a-bay-3", name: "Soute 3", size: { x: 2, y: 4, z: 2 }, offset: { x: 1, y: 0, z: 0 }, anchorFace: "left" },
      { id: "hull-a-bay-4", name: "Soute 4", size: { x: 2, y: 4, z: 2 }, offset: { x: 1, y: 0, z: 3 }, anchorFace: "left" },
    ],
  },

  {
    id: "hull-b",
    name: "Hull B",
    cargoBays: [
      { id: "hull-b-bay-1",  name: "Soute 1",  size: { x: 2, y: 8, z: 2 }, offset: { x: 0,  y: 0,  z: 4 }, anchorFace: "right"  },
      { id: "hull-b-bay-2",  name: "Soute 2",  size: { x: 2, y: 8, z: 2 }, offset: { x: 0,  y: 0,  z: 2 }, anchorFace: "right"  },
      { id: "hull-b-bay-3",  name: "Soute 3",  size: { x: 2, y: 8, z: 2 }, offset: { x: 0,  y: -9, z: 4 }, anchorFace: "right"  },
      { id: "hull-b-bay-4",  name: "Soute 4",  size: { x: 2, y: 8, z: 2 }, offset: { x: 0,  y: -9, z: 2 }, anchorFace: "right"  },
      { id: "hull-b-bay-5",  name: "Soute 5",  size: { x: 2, y: 8, z: 2 }, offset: { x: 0,  y: 0,  z: -2 }, anchorFace: "right"  },
      { id: "hull-b-bay-6",  name: "Soute 6",  size: { x: 2, y: 8, z: 2 }, offset: { x: 0,   y: 0,  z: -4 }, anchorFace: "right"  },
      { id: "hull-b-bay-7",  name: "Soute 7",  size: { x: 2, y: 8, z: 2 }, offset: { x: 0,  y: -9, z: -2 }, anchorFace: "right"  },
      { id: "hull-b-bay-8",  name: "Soute 8",  size: { x: 2, y: 8, z: 2 }, offset: { x: 0,   y: -9, z: -4 }, anchorFace: "right"  },
      { id: "hull-b-bay-9",  name: "Soute 9",  size: { x: 2, y: 8, z: 2 }, offset: { x: 6,   y: 0,  z: 2 }, anchorFace: "left"  },
      { id: "hull-b-bay-10", name: "Soute 10", size: { x: 2, y: 8, z: 2 }, offset: { x: 6,   y: 0,  z: 4 }, anchorFace: "left"  },
      { id: "hull-b-bay-11", name: "Soute 11", size: { x: 2, y: 8, z: 2 }, offset: { x: 6,   y: -9, z: 2 }, anchorFace: "left"  },
      { id: "hull-b-bay-12", name: "Soute 12", size: { x: 2, y: 8, z: 2 }, offset: { x: 6,   y: -9, z: 4 }, anchorFace: "left"  },
      { id: "hull-b-bay-13", name: "Soute 13", size: { x: 2, y: 8, z: 2 }, offset: { x: 6,  y: 0,  z: -2 }, anchorFace: "left"  },
      { id: "hull-b-bay-14", name: "Soute 14", size: { x: 2, y: 8, z: 2 }, offset: { x: 6,  y: 0,  z: -4 }, anchorFace: "left"  },
      { id: "hull-b-bay-15", name: "Soute 15", size: { x: 2, y: 8, z: 2 }, offset: { x: 6,  y: -9, z: -2 }, anchorFace: "left"  },
      { id: "hull-b-bay-16", name: "Soute 16", size: { x: 2, y: 8, z: 2 }, offset: { x: 6,  y: -9, z: -4 }, anchorFace: "left"  },
    ],
  },

  {
    id: "hull-c",
    name: "Hull C",
    cargoBays: [
      // Croix avant — ouvre sur la proue (anchorFace "rear" = face haute-y = côté avant du vaisseau)
      // Bras vertical bas (VB) : x=0..4, z=0..4
      { id: "hull-c-bay-1",  name: "Soute 1",  size: { x: 8, y: 6, z: 8 }, offset: { x: 0,  y: 4,  z: -8 }, anchorFace: "front" },
      { id: "hull-c-bay-2",  name: "Soute 2",  size: { x: 8, y: 6, z: 4 }, offset: { x: 0,  y: 4, z: -12 }, anchorFace: "front" },
      // Bras vertical haut (VT) : x=0..4, z=4..8
      { id: "hull-c-bay-3",  name: "Soute 3",  size: { x: 8, y: 6, z: 8 }, offset: { x: 0,  y: 4,  z: 8 }, anchorFace: "front" },
      { id: "hull-c-bay-4",  name: "Soute 4",  size: { x: 8, y: 6, z: 4 }, offset: { x: 0,  y: 4, z: 16 }, anchorFace: "front" },
      // Bras horizontal gauche (HL) : x=-4..0, z=2..6
      { id: "hull-c-bay-5",  name: "Soute 5",  size: { x: 8, y: 6, z: 8 }, offset: { x: -8, y: 4,  z: 0 }, anchorFace: "front" },
      { id: "hull-c-bay-6",  name: "Soute 6",  size: { x: 4, y: 6, z: 8 }, offset: { x: -12, y: 4, z: 0 }, anchorFace: "front" },
      // Bras horizontal droit (HR) : x=4..8, z=2..6
      { id: "hull-c-bay-7",  name: "Soute 7",  size: { x: 8, y: 6, z: 8 }, offset: { x: 8,  y: 4,  z: 0 }, anchorFace: "front" },
      { id: "hull-c-bay-8",  name: "Soute 8",  size: { x: 4, y: 6, z: 8 }, offset: { x: 16,  y: 4, z: 0 }, anchorFace: "front" },

      // Croix arrière — ouvre sur la poupe (anchorFace "rear" = plan normal vers −y = côté arrière du vaisseau)
      // Bras -z (bas) : même XZ que bras avant
      { id: "hull-c-bay-9",  name: "Soute 9",  size: { x: 8, y: 6, z: 8 }, offset: { x: 0,   y: -10, z: -8  }, anchorFace: "rear" },
      { id: "hull-c-bay-10", name: "Soute 10", size: { x: 8, y: 6, z: 4 }, offset: { x: 0,   y: -10, z: -12 }, anchorFace: "rear" },
      // Bras +z (haut) : même XZ que bras avant
      { id: "hull-c-bay-11", name: "Soute 11", size: { x: 8, y: 6, z: 8 }, offset: { x: 0,   y: -10, z: 8   }, anchorFace: "rear" },
      { id: "hull-c-bay-12", name: "Soute 12", size: { x: 8, y: 6, z: 4 }, offset: { x: 0,   y: -10, z: 16  }, anchorFace: "rear" },
      // Bras -x (gauche) : même XZ que bras avant
      { id: "hull-c-bay-13", name: "Soute 13", size: { x: 8, y: 6, z: 8 }, offset: { x: -8,  y: -10, z: 0   }, anchorFace: "rear" },
      { id: "hull-c-bay-14", name: "Soute 14", size: { x: 4, y: 6, z: 8 }, offset: { x: -12, y: -10, z: 0   }, anchorFace: "rear" },
      // Bras +x (droit) : même XZ que bras avant
      { id: "hull-c-bay-15", name: "Soute 15", size: { x: 8, y: 6, z: 8 }, offset: { x: 8,   y: -10, z: 0   }, anchorFace: "rear" },
      { id: "hull-c-bay-16", name: "Soute 16", size: { x: 4, y: 6, z: 8 }, offset: { x: 16,  y: -10, z: 0   }, anchorFace: "rear" },
    ],
  },

  {
    id: "idris-p",
    name: "Idris P",
    cargoBays: [
      { id: "idris-p-bay-1",  name: "Soute 1",  size: { x: 4, y: 4, z: 4 }, offset: { x: 0, y: 0,  z: 0 } },
      { id: "idris-p-bay-2",  name: "Soute 2",  size: { x: 4, y: 4, z: 4 }, offset: { x: 0, y: 6,  z: 0 } },
      { id: "idris-p-bay-3",  name: "Soute 3",  size: { x: 4, y: 4, z: 4 }, offset: { x: 0, y: 11, z: 0 } },
      { id: "idris-p-bay-4",  name: "Soute 4",  size: { x: 4, y: 4, z: 4 }, offset: { x: 0, y: 19, z: 0 } },
      { id: "idris-p-bay-5",  name: "Soute 5",  size: { x: 4, y: 4, z: 4 }, offset: { x: 0, y: 24, z: 0 } },
      { id: "idris-p-bay-6",  name: "Soute 6",  size: { x: 4, y: 4, z: 4 }, offset: { x: 0, y: 32, z: 0 } },
      { id: "idris-p-bay-7",  name: "Soute 7",  size: { x: 4, y: 4, z: 4 }, offset: { x: 0, y: 37, z: 0 } },
      { id: "idris-p-bay-8",  name: "Soute 8",  size: { x: 4, y: 4, z: 4 }, offset: { x: 0, y: 47, z: 0 } },
      { id: "idris-p-bay-9",  name: "Soute 9",  size: { x: 4, y: 4, z: 4 }, offset: { x: 6, y: 0,  z: 0 } },
      { id: "idris-p-bay-10", name: "Soute 10", size: { x: 4, y: 4, z: 4 }, offset: { x: 6, y: 6,  z: 0 } },
      { id: "idris-p-bay-11", name: "Soute 11", size: { x: 4, y: 4, z: 4 }, offset: { x: 6, y: 11, z: 0 } },
      { id: "idris-p-bay-12", name: "Soute 12", size: { x: 4, y: 4, z: 4 }, offset: { x: 6, y: 19, z: 0 } },
      { id: "idris-p-bay-13", name: "Soute 13", size: { x: 4, y: 4, z: 4 }, offset: { x: 6, y: 24, z: 0 } },
      { id: "idris-p-bay-14", name: "Soute 14", size: { x: 4, y: 4, z: 4 }, offset: { x: 6, y: 32, z: 0 } },
      { id: "idris-p-bay-15", name: "Soute 15", size: { x: 4, y: 4, z: 4 }, offset: { x: 6, y: 37, z: 0 } },
      { id: "idris-p-bay-16", name: "Soute 16", size: { x: 4, y: 4, z: 4 }, offset: { x: 6, y: 47, z: 0 } },
      {
        id: "idris-p-bay-17",
        name: "Soute 17",
        size: { x: 18, y: 4, z: 2 },
        offset: { x: 12, y: 0, z: 0 },
      },
      {
        id: "idris-p-bay-18",
        name: "Soute 18",
        size: { x: 14, y: 5, z: 2 },
        offset: { x: 14, y: 6, z: 0 },
      },
      {
        id: "idris-p-bay-19",
        name: "Soute 19",
        size: { x: 3, y: 4, z: 2 },
        offset: { x: 17, y: 13, z: 0 },
      },
      {
        id: "idris-p-bay-20",
        name: "Soute 20",
        size: { x: 3, y: 4, z: 2 },
        offset: { x: 22, y: 13, z: 0 },
      },
    ],
  },
{
  id: "idris-m",
  name: "Idris M",
  cargoBays: [
    { id: "idris-m-bay-1",  name: "Soute 1",  size: { x: 4, y: 4, z: 4 }, offset: { x: 0, y: 0,  z: 0 } },
    { id: "idris-m-bay-2",  name: "Soute 2",  size: { x: 4, y: 4, z: 4 }, offset: { x: 0, y: 6,  z: 0 } },
    { id: "idris-m-bay-3",  name: "Soute 3",  size: { x: 4, y: 4, z: 4 }, offset: { x: 0, y: 11, z: 0 } },
    { id: "idris-m-bay-4",  name: "Soute 4",  size: { x: 4, y: 4, z: 4 }, offset: { x: 0, y: 19, z: 0 } },
    { id: "idris-m-bay-5",  name: "Soute 5",  size: { x: 4, y: 4, z: 4 }, offset: { x: 0, y: 24, z: 0 } },
    { id: "idris-m-bay-6",  name: "Soute 6",  size: { x: 4, y: 4, z: 4 }, offset: { x: 0, y: 32, z: 0 } },
    { id: "idris-m-bay-7",  name: "Soute 7",  size: { x: 4, y: 4, z: 4 }, offset: { x: 0, y: 37, z: 0 } },
    { id: "idris-m-bay-8",  name: "Soute 8",  size: { x: 4, y: 4, z: 4 }, offset: { x: 0, y: 47, z: 0 } },
    { id: "idris-m-bay-9",  name: "Soute 9",  size: { x: 4, y: 4, z: 4 }, offset: { x: 6, y: 0,  z: 0 } },
    { id: "idris-m-bay-10", name: "Soute 10", size: { x: 4, y: 4, z: 4 }, offset: { x: 6, y: 6,  z: 0 } },
    { id: "idris-m-bay-11", name: "Soute 11", size: { x: 4, y: 4, z: 4 }, offset: { x: 6, y: 11, z: 0 } },
    { id: "idris-m-bay-12", name: "Soute 12", size: { x: 4, y: 4, z: 4 }, offset: { x: 6, y: 19, z: 0 } },
    { id: "idris-m-bay-13", name: "Soute 13", size: { x: 4, y: 4, z: 4 }, offset: { x: 6, y: 24, z: 0 } },
    { id: "idris-m-bay-14", name: "Soute 14", size: { x: 4, y: 4, z: 4 }, offset: { x: 6, y: 32, z: 0 } },
    { id: "idris-m-bay-15", name: "Soute 15", size: { x: 4, y: 4, z: 4 }, offset: { x: 6, y: 37, z: 0 } },
    { id: "idris-m-bay-16", name: "Soute 16", size: { x: 4, y: 4, z: 4 }, offset: { x: 6, y: 47, z: 0 } },
    { id: "idris-m-bay-17", name: "Soute 17", size: { x: 18, y: 4, z: 2 }, offset: { x: 12, y: 0, z: 0 }, },
    { id: "idris-m-bay-18", name: "Soute 18", size: { x: 14, y: 5, z: 2 }, offset: { x: 14, y: 6, z: 0 }, },
  ],
},

  {
    id: "m2-hercules-starlifter",
    name: "M2 Hercules",
    cargoBays: [
      { id: "m2-bay-1", name: "Soute 1", size: { x: 8, y: 15, z: 3 }, offset: { x: 0, y: -7, z: 0 }, },
      { id: "m2-bay-2", name: "Soute 2", size: { x: 6, y: 9, z: 3 }, offset: { x: 1, y: 9, z: 0 }, },
    ],
  },

  {
    id: "mercury-star-runner",
    name: "Mercury Star Runner",
    cargoBays: [
      { id: "mercury-star-runner-bay-1", name: "Soute 1", size: { x: 6, y: 6, z: 3 }, offset: { x: 0, y: 0, z: 0 }, },
      { id: "mercury-star-runner-bay-2", name: "Soute 2", size: { x: 1, y: 3, z: 2 }, offset: { x: -2, y: 0, z: 0 }, },
    ],
  },

  {
    id: "nomad",
    name: "Nomad",
    cargoBays: [
      { id: "nomad-bay-1", name: "Soute 1", size: { x: 3, y: 4, z: 2 }, offset: { x: 0, y: 0, z: 0 }, },
    ],
  },

  {
    id: "prowler-utility",
    name: "Prowler Utility",
    cargoBays: [
      { id: "prowler-utility-bay-1", name: "Soute 1", size: { x: 2, y: 4, z: 2 }, offset: { x: -3, y: 0, z: 0 }, anchorFace: "ceiling" },
      { id: "prowler-utility-bay-2", name: "Soute 2", size: { x: 2, y: 4, z: 2 }, offset: { x: 1, y: 0, z: 0 }, anchorFace: "ceiling" },
    ],
  },
{
  id: "reclaimer",
  name: "Reclaimer",
  cargoBays: [
    { id: "reclaimer-bay-1", name: "Soute 1", size: { x: 5, y: 5, z: 2 }, offset: { x: -3, y: 0, z: 0 }, },
    { id: "reclaimer-bay-2", name: "Soute 2", size: { x: 5, y: 5, z: 2 }, offset: { x: 3, y: 0, z: 0 }, },
    { id: "reclaimer-bay-3", name: "Soute 3", size: { x: 5, y: 7, z: 2 }, offset: { x: -3, y: -11, z: 0 }, },
    { id: "reclaimer-bay-4", name: "Soute 4", size: { x: 5, y: 7, z: 2 }, offset: { x: 3, y: -11, z: 0 }, },
    { id: "reclaimer-bay-5", name: "Soute 5", size: { x: 3, y: 2, z: 3 }, offset: { x: 11, y: 3, z: 0 }, },
    { id: "reclaimer-bay-6", name: "Soute 6", size: { x: 3, y: 2, z: 3 }, offset: { x: 16, y: 3, z: 0 }, },
    { id: "reclaimer-bay-7", name: "Soute 7", size: { x: 3, y: 3, z: 3 }, offset: { x: 11, y: -2, z: 0 }, },
    { id: "reclaimer-bay-8", name: "Soute 8", size: { x: 3, y: 3, z: 3 }, offset: { x: 16, y: -2, z: 0 }, },
    { id: "reclaimer-bay-9", name: "Soute 9", size: { x: 3, y: 3, z: 3 }, offset: { x: 11, y: -7, z: 0 }, },
    { id: "reclaimer-bay-10", name: "Soute 10", size: { x: 3, y: 3, z: 3 }, offset: { x: 16, y: -7, z: 0 }, },
    { id: "reclaimer-bay-11", name: "Soute 11", size: { x: 3, y: 2, z: 3 }, offset: { x: 11, y: -11, z: 0 }, },
    { id: "reclaimer-bay-12", name: "Soute 12", size: { x: 3, y: 2, z: 3 }, offset: { x: 16, y: -11, z: 0 }, },

  ],
},

  {
    id: "shiv",
    name: "Shiv",
    cargoBays: [
      { id: "shiv-bay-1", name: "Soute 1", size: { x: 2, y: 8, z: 2 }, offset: { x: 0, y: 0, z: 0 }, },
    ],
  },

  {
    id: "starlancer-max",
    name: "Starlancer MAX",
    cargoBays: [
      { id: "starlancer-max-bay-1", name: "Soute 1", size: { x: 2, y: 16, z: 2 }, offset: { x: -2, y: 0, z: 0 }, },
      { id: "starlancer-max-bay-2", name: "Soute 2", size: { x: 2, y: 16, z: 2 }, offset: { x: 2, y: 0, z: 0 },},
      { id: "starlancer-max-bay-3", name: "Soute 3", size: { x: 2, y: 8, z: 3 }, offset: { x: -4, y: -10, z: 0 }, },
      { id: "starlancer-max-bay-4", name: "Soute 4", size: { x: 2, y: 8, z: 3 }, offset: { x: 4, y: -10, z: 0 }, },
    ],
  },

  {
    id: "starlancer-tac",
    name: "Starlancer TAC",
    cargoBays: [
      { id: "starlancer-tac-bay-1", name: "Soute 1", size: { x: 2, y: 8, z: 3 }, offset: { x: -4, y: 0, z: 0 }, },
      { id: "starlancer-tac-bay-2", name: "Soute 2", size: { x: 2, y: 8, z: 3 }, offset: { x: 4, y: 0, z: 0 }, },
    ],
  },

  {
    id: "starfarer",
    name: "Starfarer",
    cargoBays: [
      { id: "starfarer-bay-1", name: "Soute 1", size: { x: 5, y: 7, z: 5 }, offset: { x: -2, y: -2, z: 0 }, },
      { id: "starfarer-bay-2", name: "Soute 2", size: { x: 2, y: 5, z: 5 }, offset: { x: 6, y: 0, z: 0 }, group: "starfarer-right", },
      { id: "starfarer-bay-3", name: "Soute 3", size: { x: 2, y: 5, z: 5 }, offset: { x: -7, y: 0, z: 0 }, group: "starfarer-left", },
      { id: "starfarer-bay-4", name: "Soute 4", size: { x: 2, y: 2, z: 2 }, offset: { x: 6, y: -2, z: 0 }, group: "starfarer-right", },
      { id: "starfarer-bay-5", name: "Soute 5", size: { x: 2, y: 2, z: 2 }, offset: { x: -7, y: -2, z: 0 }, group: "starfarer-left", },
    ],
  },

  {
    id: "valkyrie",
    name: "Valkyrie",
    cargoBays: [
      { id: "valkyrie-bay-1", name: "Soute 1", size: { x: 5, y: 6, z: 3 }, offset: { x: 0, y: 0, z: 0 }, },
    ],
  },

  {
    id: "zeus-mk-ii-cl",
    name: "Zeus Mk II CL",
    cargoBays: [
      { id: "zeus-mk-ii-cl-bay-1", name: "Soute 1a", size: { x: 5, y: 8, z: 3 }, offset: { x: 0, y: 0, z: 0 }, group: "soute-1", },
      { id: "zeus-mk-ii-cl-bay-2", name: "Soute 1b", size: { x: 1, y: 2, z: 2 }, offset: { x: -1, y: 2, z: 0 }, group: "soute-1", },
      { id: "zeus-mk-ii-cl-bay-3", name: "Soute 1c", size: { x: 1, y: 2, z: 2 }, offset: { x: 5, y: 2, z: 0 }, group: "soute-1", },
    ],
  },
];
