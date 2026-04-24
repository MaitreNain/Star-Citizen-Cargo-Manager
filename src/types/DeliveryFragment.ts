/**
 * Un fragment représente une portion d'une livraison placée dans une baie.
 * Une livraison peut être fragmentée sur plusieurs baies.
 */
export type DeliveryFragment = {
  id: string;          // identifiant unique du fragment
  contractId: string;
  deliveryId: string;
  bayId: string;
  placedScu: number;   // SCU effectivement placés dans cette baie
  totalScu: number;    // SCU total de la livraison (pour calculer le restant)
};
