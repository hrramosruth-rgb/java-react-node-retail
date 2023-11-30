package demo.retail;
import java.util.Map;
import java.util.NoSuchElementException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
@RestControllerAdvice
public class ApiErrors {
 @ExceptionHandler({IllegalArgumentException.class,MethodArgumentNotValidException.class,HttpMessageNotReadableException.class})
 public ResponseEntity<Map<String,String>> invalid(Exception error) {return ResponseEntity.badRequest().body(Map.of("error","Provide valid JSON with a SKU and integer quantity from 1 to 100."));}
 @ExceptionHandler(NoSuchElementException.class)
 public ResponseEntity<Map<String,String>> missing(NoSuchElementException error) {return ResponseEntity.status(404).body(Map.of("error",error.getMessage()));}
 @ExceptionHandler(IllegalStateException.class)
 public ResponseEntity<Map<String,String>> conflict(IllegalStateException error) {return ResponseEntity.status(409).body(Map.of("error",error.getMessage()));}
}
