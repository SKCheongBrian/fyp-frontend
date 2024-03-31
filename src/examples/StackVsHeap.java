public class StackVsHeap {
  public static void main(String[] args) {
    int x = 1; // notice this is on the stack
    Integer y1 = 2; // notice this is on the heap
    Integer y2 = 2; // notice the caching for values <= 128
    Integer z1 = 129; // notice this is > 128
    Integer z2 = 129; // notice no caching (new Integer created)
    boolean b = true; // on the stack
    Boolean b2 = true; // created on the heap
    Boolean b3 = true; // on the heap with caching
  }  
}
