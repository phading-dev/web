export class LinkedNode<T> {
  public prev: LinkedNode<T>;
  public next: LinkedNode<T>;

  public constructor(public reduceSize: () => void, public value?: T) {}

  public remove(): void {
    let next = this.next;
    let prev = this.prev;
    prev.next = next;
    next.prev = prev;
    this.reduceSize();
  }
}

export class LinkedList<T> {
  private size = 0;
  private reduceSize = (): void => {
    this.size--;
  };
  private head = new LinkedNode<T>(this.reduceSize);
  private tail = new LinkedNode<T>(this.reduceSize);

  public constructor() {
    this.clear();
  }

  public pushBack(value: T): LinkedNode<T> {
    let node = new LinkedNode(this.reduceSize, value);
    let prev = this.tail.prev;
    prev.next = node;
    node.prev = prev;
    this.tail.prev = node;
    node.next = this.tail;
    this.size++;
    return node;
  }

  public popFront(): T {
    let ret = this.head.next;
    ret.remove();
    return ret.value;
  }

  public clear(): void {
    this.head.next = this.tail;
    this.tail.prev = this.head;
    this.size = 0;
  }

  public getSize(): number {
    return this.size;
  }

  public forEach(callback: (arg: T) => void): void {
    for (let it = this.head.next; it !== this.tail; it = it.next) {
      callback(it.value);
    }
  }

  public forEachReverse(callback: (arg: T) => void): void {
    for (let it = this.tail.prev; it !== this.head; it = it.prev) {
      callback(it.value);
    }
  }

  public forEachNode(callback: (arg: LinkedNode<T>) => void): void {
    for (let it = this.head.next; it !== this.tail; ) {
      let current = it;
      it = it.next;
      callback(current);
    }
  }

  public forEachNodeReverse(callback: (arg: LinkedNode<T>) => void): void {
    for (let it = this.tail.prev; it !== this.head; ) {
      let current = it;
      it = it.prev;
      callback(current);
    }
  }

  public toArray(): T[] {
    let ret: T[] = [];
    this.forEach((element): void => {
      ret.push(element);
    });
    return ret;
  }
}
