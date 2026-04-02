export type  UserRole = 'Admin' |
                        'Foreman' |
                        'Logistics' |
                        'ProjectManager';

export interface Credential {
    email: string;
    hashedPassword: string;         // backend only
    role: UserRole;
    // permissionLevel: number; (omit)
}

export interface Material{
    materialName: string
    materialDescription: string;
    materialAmount: number;
}

export interface Equipment{
    equipmentName: string;
    equipmentDescription: string;
    equipmentSerialNumber: string;
    equipmentAmount: number;
}

export interface Tool{
    toolName: string;
    toolIdNumber: string;
}
export interface Inventory{
    materials: Material[];
    equipment: Equipment[];
    tools: Tool[];
}

export interface Jobsite{
    jobsiteId: string;              // unique identifier for jobsite
    jobsiteName: string;            // display name of jobsite
    jobsiteAddress: string;         // street address of the jobsite
    inventory: Inventory;
}

export interface Warehouse{
    warehouseName: string;
    warehouseAddress: string;
    warehouseId: string;
    deliveries: Delivery[];         // deliveries currently staged at this warehouse
}

export interface Delivery{
    deliveryId: string;
    arrivedAt: string;
    inventory: Inventory;           // items in this shipment
    destination: string;            // jobsiteId
    isConfirmed: boolean;           // true once packing slip scan is correct
}

export type PayorderStatus = 'pending' | 'partial' | 'fulfilled';

export interface Payorder{
    payorderId: string;
    destination: string;            // jobsiteId
    inventory: Inventory;           // expected materials that haven't arrived yet
    uploadedAt: string;
    status: PayorderStatus;         // should be auto-updated
    uploadedBy: string;             // email of PM who uploaded it
}
