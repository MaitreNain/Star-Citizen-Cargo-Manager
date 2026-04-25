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
      },
    ],
  },

  {
    id: "hull-a",
    name: "Hull A",
    cargoBays: [
      {
        id: "hull-a-bay-1",
        name: "Soute 1",
        size: { x: 2, y: 4, z: 2 },
        offset: { x: -3, y: 0, z: 0 },
      },
      {
        id: "hull-a-bay-2",
        name: "Soute 2",
        size: { x: 2, y: 4, z: 2 },
        offset: { x: -3, y: 0, z: 3 },
      },
      {
        id: "hull-a-bay-3",
        name: "Soute 3",
        size: { x: 2, y: 4, z: 2 },
        offset: { x: 1, y: 0, z: 0 },
      },
      {
        id: "hull-a-bay-4",
        name: "Soute 4",
        size: { x: 2, y: 4, z: 2 },
        offset: { x: 1, y: 0, z: 3 },
      },
    ],
  },

  {
    id: "hull-b",
    name: "Hull B",
    cargoBays: [
      // Rangée haute inward (z=10)
      { id: "hull-b-bay-1",  name: "Soute 1",  size: { x: 2, y: 8, z: 2 }, offset: { x: -2, y: 0,  z: 10 } },
      { id: "hull-b-bay-2",  name: "Soute 2",  size: { x: 2, y: 8, z: 2 }, offset: { x: 1,  y: 0,  z: 10 } },
      { id: "hull-b-bay-3",  name: "Soute 3",  size: { x: 2, y: 8, z: 2 }, offset: { x: -2, y: -9, z: 10 } },
      { id: "hull-b-bay-4",  name: "Soute 4",  size: { x: 2, y: 8, z: 2 }, offset: { x: 1,  y: -9, z: 10 } },
      // Rangée haute outward (z=7)
      { id: "hull-b-bay-5",  name: "Soute 5",  size: { x: 2, y: 8, z: 2 }, offset: { x: -4, y: 0,  z: 7 } },
      { id: "hull-b-bay-6",  name: "Soute 6",  size: { x: 2, y: 8, z: 2 }, offset: { x: 3,  y: 0,  z: 7 } },
      { id: "hull-b-bay-7",  name: "Soute 7",  size: { x: 2, y: 8, z: 2 }, offset: { x: -4, y: -9, z: 7 } },
      { id: "hull-b-bay-8",  name: "Soute 8",  size: { x: 2, y: 8, z: 2 }, offset: { x: 3,  y: -9, z: 7 } },
      // Rangée basse outward (z=3)
      { id: "hull-b-bay-9",  name: "Soute 9",  size: { x: 2, y: 8, z: 2 }, offset: { x: -4, y: 0,  z: 3 } },
      { id: "hull-b-bay-10", name: "Soute 10", size: { x: 2, y: 8, z: 2 }, offset: { x: 3,  y: 0,  z: 3 } },
      { id: "hull-b-bay-11", name: "Soute 11", size: { x: 2, y: 8, z: 2 }, offset: { x: -4, y: -9, z: 3 } },
      { id: "hull-b-bay-12", name: "Soute 12", size: { x: 2, y: 8, z: 2 }, offset: { x: 3,  y: -9, z: 3 } },
      // Rangée basse inward (z=0)
      { id: "hull-b-bay-13", name: "Soute 13", size: { x: 2, y: 8, z: 2 }, offset: { x: -2, y: 0,  z: 0 } },
      { id: "hull-b-bay-14", name: "Soute 14", size: { x: 2, y: 8, z: 2 }, offset: { x: 1,  y: 0,  z: 0 } },
      { id: "hull-b-bay-15", name: "Soute 15", size: { x: 2, y: 8, z: 2 }, offset: { x: -2, y: -9, z: 0 } },
      { id: "hull-b-bay-16", name: "Soute 16", size: { x: 2, y: 8, z: 2 }, offset: { x: 1,  y: -9, z: 0 } },
    ],
  },

  {
    id: "hull-c",
    name: "Hull C",
    cargoBays: [
      {
        id: "hull-c-bay-1",
        name: "Soute 1",
        size: { x: 8, y: 8, z: 6 },
        offset: { x: 0, y: 20, z: 0 },
      },
      {
        id: "hull-c-bay-2",
        name: "Soute 2",
        size: { x: 8, y: 4, z: 6 },
        offset: { x: 0, y: 28, z: 0 },
      },
      {
        id: "hull-c-bay-3",
        name: "Soute 3",
        size: { x: 8, y: 8, z: 6 },
        offset: { x: -9, y: 15, z: 0 },
      },
      {
        id: "hull-c-bay-4",
        name: "Soute 4",
        size: { x: 4, y: 8, z: 6 },
        offset: { x: -13, y: 15, z: 0 },
      },
      {
        id: "hull-c-bay-5",
        name: "Soute 5",
        size: { x: 8, y: 8, z: 6 },
        offset: { x: 0, y: 10, z: 0 },
      },
      {
        id: "hull-c-bay-6",
        name: "Soute 6",
        size: { x: 8, y: 4, z: 6 },
        offset: { x: 0, y: 6, z: 0 },
      },
      {
        id: "hull-c-bay-7",
        name: "Soute 7",
        size: { x: 8, y: 8, z: 6 },
        offset: { x: 9, y: 15, z: 0 },
      },
      {
        id: "hull-c-bay-8",
        name: "Soute 8",
        size: { x: 4, y: 8, z: 6 },
        offset: { x: 17, y: 15, z: 0 },
      },
      {
        id: "hull-c-bay-9",
        name: "Soute 9",
        size: { x: 8, y: 8, z: 6 },
        offset: { x: 0, y: -10, z: 0 },
      },
      {
        id: "hull-c-bay-10",
        name: "Soute 10",
        size: { x: 8, y: 4, z: 6 },
        offset: { x: 0, y: -2, z: 0 },
      },
      {
        id: "hull-c-bay-11",
        name: "Soute 11",
        size: { x: 8, y: 8, z: 6 },
        offset: { x: -9, y: -15, z: 0 },
      },
      {
        id: "hull-c-bay-12",
        name: "Soute 12",
        size: { x: 4, y: 8, z: 6 },
        offset: { x: -13, y: -15, z: 0 },
      },
      {
        id: "hull-c-bay-13",
        name: "Soute 13",
        size: { x: 8, y: 8, z: 6 },
        offset: { x: 0, y: -20, z: 0 },
      },
      {
        id: "hull-c-bay-14",
        name: "Soute 14",
        size: { x: 8, y: 4, z: 6 },
        offset: { x: 0, y: -24, z: 0 },
      },
      {
        id: "hull-c-bay-15",
        name: "Soute 15",
        size: { x: 8, y: 8, z: 6 },
        offset: { x: 9, y: -15, z: 0 },
      },
      {
        id: "hull-c-bay-16",
        name: "Soute 16",
        size: { x: 4, y: 8, z: 6 },
        offset: { x: 17, y: -15, z: 0 },
      },
    ],
  },

  {
    id: "m2-hercules-starlifter",
    name: "M2 Hercules",
    cargoBays: [
      {
        id: "m2-bay-1",
        name: "Soute 1",
        size: { x: 8, y: 15, z: 3 },
        offset: { x: 0, y: -7, z: 0 },
      },
      {
        id: "m2-bay-2",
        name: "Soute 2",
        size: { x: 6, y: 9, z: 3 },
        offset: { x: 1, y: 9, z: 0 },
      },
    ],
  },

  {
    id: "mercury-star-runner",
    name: "Mercury Star Runner",
    cargoBays: [
      {
        id: "mercury-star-runner-bay-1",
        name: "Soute 1",
        size: { x: 6, y: 6, z: 3 },
        offset: { x: 0, y: 0, z: 0 },
      },
      {
        id: "mercury-star-runner-bay-2",
        name: "Soute 2",
        size: { x: 1, y: 3, z: 2 },
        offset: { x: -2, y: 0, z: 0 },
      },
    ],
  },

  {
    id: "nomad",
    name: "Nomad",
    cargoBays: [
      {
        id: "nomad-bay-1",
        name: "Soute 1",
        size: { x: 3, y: 4, z: 2 },
        offset: { x: 0, y: 0, z: 0 },
      },
    ],
  },

  {
    id: "prowler-utility",
    name: "Prowler Utility",
    cargoBays: [
      {
        id: "prowler-utility-bay-1",
        name: "Soute 1",
        size: { x: 2, y: 4, z: 2 },
        offset: { x: -3, y: 0, z: 0 },
      },
      {
        id: "prowler-utility-bay-2",
        name: "Soute 2",
        size: { x: 2, y: 4, z: 2 },
        offset: { x: 1, y: 0, z: 0 },
      },
    ],
  },

  {
    id: "shiv",
    name: "Shiv",
    cargoBays: [
      {
        id: "shiv-bay-1",
        name: "Soute 1",
        size: { x: 2, y: 8, z: 2 },
        offset: { x: 0, y: 0, z: 0 },
      },
    ],
  },

  {
    id: "starlancer-max",
    name: "Starlancer MAX",
    cargoBays: [
      {
        id: "starlancer-max-bay-1",
        name: "Soute 1",
        size: { x: 2, y: 16, z: 2 },
        offset: { x: -2, y: 0, z: 0 },
      },
      {
        id: "starlancer-max-bay-2",
        name: "Soute 2",
        size: { x: 2, y: 16, z: 2 },
        offset: { x: 2, y: 0, z: 0 },
      },
      {
        id: "starlancer-max-bay-3",
        name: "Soute 3",
        size: { x: 2, y: 8, z: 3 },
        offset: { x: -4, y: -10, z: 0 },
      },
      {
        id: "starlancer-max-bay-4",
        name: "Soute 4",
        size: { x: 2, y: 8, z: 3 },
        offset: { x: 4, y: -10, z: 0 },
      },
    ],
  },

  {
    id: "valkyrie",
    name: "Valkyrie",
    cargoBays: [
      {
        id: "valkyrie-bay-1",
        name: "Soute 1",
        size: { x: 5, y: 6, z: 3 },
        offset: { x: 0, y: 0, z: 0 },
      },
    ],
  },
];
