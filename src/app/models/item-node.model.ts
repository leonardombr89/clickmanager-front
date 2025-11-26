export class ItemNode {
  item!: string;     
  chave!: string;    
  children?: ItemNode[];
}

export class ItemFlatNode {
  item!: string;
  chave!: string;
  level!: number;
  expandable!: boolean;
}