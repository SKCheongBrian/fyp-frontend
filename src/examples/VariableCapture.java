interface C {
  void g();
}

class A {
  int x = 1;

  C f() {
    int y = 2;

    class B implements C {
      @Override
      public void g() {
        x = y; // accessing x and y is OK.
      }
    }

    B b = new B();
    return b;
  }
}

public class VariableCapture {
  public static void main(String[] args) {
    A a = new A();
    C b = a.f(); // notice y is no longer on stack
    b.g(); // uses the captured variable (val$y) to get value of y
    // notice the value of a's x
  }
}