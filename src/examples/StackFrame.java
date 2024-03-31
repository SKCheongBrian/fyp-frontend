public class StackFrame {
  public static void foo() {
    int x = 2;
    bar(x + 1);
  }
  
  public static void bar(int x) {
    baz(x + 1);
  }
  
  public static void baz(int x) {
    x = 4;
  }

  public static void main(String[] args) {
    int x = 1;
    foo();
  }
}
