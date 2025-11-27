// Manages an inventory UI with slot-based item storage
export class Inventory {
    private container: HTMLDivElement;
    private slots: HTMLElement[] = [];
    private static readonly SLOT_COUNT = 3;

    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'inventory-bar';
        document.body.appendChild(this.container);
        this.initializeSlots();
    }

    // Creates the inventory slot elements
    private initializeSlots(): void {
        for (let i = 0; i < Inventory.SLOT_COUNT; i++) {
            const slot = document.createElement('div');
            slot.className = 'inv-slot';
            this.container.appendChild(slot);
            this.slots.push(slot);
        }
    }

    /**
     * Adds a colored item to the first available slot
     * @returns true if item was added, false if inventory is full
     */
    addItem(color: string): boolean {
        const emptySlot = this.slots.find(slot => slot.children.length === 0);
        
        if (!emptySlot) return false;

        const item = document.createElement('div');
        item.className = 'inv-item';
        item.style.backgroundColor = color;
        emptySlot.appendChild(item);
        return true;
    }

    // Checks if inventory contains an item of the specified color
    hasItem(color: string): boolean {
        return this.slots.some(slot => {
            const item = slot.firstElementChild as HTMLElement;
            return item?.style.backgroundColor === color;
        });
    }
}