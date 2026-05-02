export type ContractDelivery = {
  id: string;
  commodity: string;
  destination: string;
  scu: number;
  pickupLocation: string;
  explicitCrates?: { sizeScu: number; count: number }[];
};

export type Contract = {
  id: string;
  name: string;
  maxContainerSize: number;
  color: string;
  deliveryOrder: number;
  deliveries: ContractDelivery[];
};
