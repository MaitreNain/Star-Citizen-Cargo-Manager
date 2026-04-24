import type { Contract } from "../types/Contract";

export const contracts: Contract[] = [
  {
    id: "contract-1",
    name: "Contrat #1",
    maxContainerSize: 16,
    color: "#f97316",
    deliveryOrder: 1,
    deliveries: [
      {
        id: "delivery-1",
        commodity: "Hydrogen Fuel",
        destination: "CRU-L5",
        scu: 60,
        pickupLocation: "Teasa Spaceport",
      },
      {
        id: "delivery-2",
        commodity: "Quantum Fuel",
        destination: "CRU-L2",
        scu: 135,
        pickupLocation: "Teasa Spaceport",
      },
      {
        id: "delivery-3",
        commodity: "Ship Ammo",
        destination: "CRU-L4",
        scu: 108,
        pickupLocation: "Teasa Spaceport",
      },
      {
        id: "delivery-4",
        commodity: "Hydrogen Fuel",
        destination: "CRU-L1",
        scu: 63,
        pickupLocation: "Teasa Spaceport",
      },
    ],
  },
];
