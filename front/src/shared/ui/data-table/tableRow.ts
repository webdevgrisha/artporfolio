/** An item of a table with its place in the list, which the sorting of the table does not change. */
export interface TableRow<TItem> {
  item: TItem;
  /** From 1, in the order of the site, which «№» keeps showing after a sort and while searching. */
  position: number;
}
