export interface inventoryItem {
  type:string;
  id:string;
  name:string;
  amount:string;
}

export const mockItemList: inventoryItem[] = [
  {type: 'M', id: '', name: '20 mm Plastic Tubing', amount: '100'},
  {type: 'M', id: '', name: '4x5 Wood Paneling', amount: '3'},
  {type: 'E', id: '2351513', name: 'Cooling Unit', amount: '4'},
  {type: 'T', id: '1305921491451', name: 'Hand Drill', amount: '1'}
]

export interface Jobsite {
  id: string;
  address: string;
  inventory: inventoryItem[];
}

export const mockJobsites: Jobsite[] = [
  { id: '1246223', address: '5412 Thorenview Rd Baltimore, MD', inventory:mockItemList},
  { id: '1282134', address: '0991 Marryway Blvd Bethesda, MD', inventory:mockItemList},
  { id: '3451209', address: '2049 Suntash Rd Richmond, VA', inventory:mockItemList},
  { id: '5329109', address: '6767 Handsmotion St Rockville, MD', inventory:mockItemList},
  { id: '8875302', address: '8112 Bandanna Rd Germantown, MD', inventory:mockItemList},
  
  // Extra data to force scrolling:
  { id: '9928172', address: '101 Main St Annapolis, MD' , inventory:mockItemList},
  { id: '4455667', address: '555 Tech Corridor Herndon, VA' , inventory:mockItemList},
  { id: '1122334', address: '789 Industrial Pkwy Towson, MD' , inventory:mockItemList},
  { id: '5544332', address: '321 Construction Way DC' , inventory:mockItemList},
  { id: '9988776', address: '88 Builder Blvd Arlington, VA' , inventory:mockItemList},
];

export interface Payorder {
  id: string; // Database ID (hidden in UI)
  address: string;
  payorderNumber: string;
}

export const mockPayorders: Payorder[] = [
  { id: '1', address: '5412 Thorenview Rd Baltimore, MD', payorderNumber: '0000231' },
  { id: '2', address: '5412 Thorenview Rd Baltimore, MD', payorderNumber: '0000232' },
  { id: '3', address: '5412 Thorenview Rd Baltimore, MD', payorderNumber: '0000233' },
  { id: '4', address: '6767 Handsmotion St Rockville, MD', payorderNumber: '0000001' },
  { id: '5', address: '6767 Handsmotion St Rockville, MD', payorderNumber: '0000002' },
  // Extra data for scrolling
  { id: '6', address: '0991 Marryway Blvd Bethesda, MD', payorderNumber: '0000115' },
  { id: '7', address: '2049 Suntash Rd Richmond, VA', payorderNumber: '0000889' },
  { id: '8', address: '8112 Bandanna Rd Germantown, MD', payorderNumber: '0000442' },
];

export interface Warehouse {
  id: string;
  address: string;
}

export const mockWarehouses: Warehouse[] = [
  { id: '0000001', address: '9129 Lenten Dr Rockville MD' },
  { id: '0000002', address: '0191 Tuefort Blvd Bethesda, MD' },
];

export interface Delivery {
  id: string;
  warehouseId: string;
  destinationAddress: string;
  deliveryNumber: string;
}

export const mockDeliveries: Delivery[] = [
  { id: '1', warehouseId: '0000001', destinationAddress: '5412 Thorenview Rd Baltimore, MD', deliveryNumber: '9210395021' },
  { id: '2', warehouseId: '0000001', destinationAddress: '5412 Thorenview Rd Baltimore, MD', deliveryNumber: '9210397912' },
  { id: '3', warehouseId: '0000002', destinationAddress: '6767 Handsmotion St Rockville, MD', deliveryNumber: '1294845991' },
  { id: '4', warehouseId: '0000002', destinationAddress: '6767 Handsmotion St Rockville, MD', deliveryNumber: '1297918293' },
];




