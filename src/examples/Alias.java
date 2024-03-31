class Point {
  public final int x;
  public final int y;

  public Point(int x, int y) {
    this.x = x;
    this.y = y;
  }
}

public class Alias {
  public static Point mystery(Point p) {
    p = new Point(2, 2);
    return p;
  }

  public static void main(String[] args) {
    Point p = new Point(1, 1);
    Point p2 = mystery(p); // notice that p points to same object
  }
}
