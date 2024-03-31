class Node {
  private int value;
  private Node next;

  public Node(int value, Node next) {
    this.value = value;
    this.next = next;
  }

  public Node(int value) {
    this.value = value;
  }
}

class Constructor {
  private int a;
  private int b;
  private int c;
  private Node node;

  public Constructor(int a, int b, int c, Node node) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.node = node;
  }

  public static void main(String[] args) {
    Constructor example = new Constructor(1, 2, 3, new Node(4));
  }
}