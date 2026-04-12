export interface Jobsite {
  id: string;
  address: string;
}

export const mockJobsites: Jobsite[] = [
  { id: '1246223', address: '5412 Thorenview Rd Baltimore, MD' },
  { id: '1282134', address: '0991 Marryway Blvd Bethesda, MD' },
  { id: '3451209', address: '2049 Suntash Rd Richmond, VA' },
  { id: '5329109', address: '6767 Handsmotion St Rockville, MD' },
  { id: '8875302', address: '8112 Bandanna Rd Germantown, MD' },
  
  // Extra data to force scrolling:
  { id: '9928172', address: '101 Main St Annapolis, MD' },
  { id: '4455667', address: '555 Tech Corridor Herndon, VA' },
  { id: '1122334', address: '789 Industrial Pkwy Towson, MD' },
  { id: '5544332', address: '321 Construction Way DC' },
  { id: '9988776', address: '88 Builder Blvd Arlington, VA' },
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
  // Extra data to ensure scrolling
  { id: '6', address: '0991 Marryway Blvd Bethesda, MD', payorderNumber: '0000115' },
  { id: '7', address: '2049 Suntash Rd Richmond, VA', payorderNumber: '0000889' },
  { id: '8', address: '8112 Bandanna Rd Germantown, MD', payorderNumber: '0000442' },
];