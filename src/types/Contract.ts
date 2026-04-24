export type ContractDelivery = {
  id: string;
  commodity: string;
  destination: string;
  scu: number;
  pickupLocation: string; // lieu de chargement — toujours requis
};

export type Contract = {
  id: string;
  name: string;
  maxContainerSize: number;
  color: string;
  deliveryOrder: number;
  deliveries: ContractDelivery[];
};
