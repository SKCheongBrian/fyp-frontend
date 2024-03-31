public class Scoping {
  private int x;

  public Scoping(int x) {
    this.x = x;
  }

  private void firstMethod() {
    x = 2; // Notice this changes this.x
    int x = 2; // Notice a new variable is added onto stack
    this.x = x + 10; // x on right hand side refers to variable x
    secondMethod(x);
  }

  private void secondMethod(int x) {
    x = 10;
    this.x = x - 10;
  }

  public static void main(String[] args) {
    Scoping scoping = new Scoping(1);
    scoping.firstMethod();
  }
}
