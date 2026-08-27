package com.forgeai.backend.controller;

import com.forgeai.backend.entity.Product;
import com.forgeai.backend.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductRepository productRepository;

    @Autowired
    public ProductController(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @PostMapping
    public ResponseEntity<?> createProduct(@RequestBody Product product) {
        if (product.getName() == null || product.getName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(createErrorResponse("Product name is required."));
        }
        if (product.getPrice() == null) {
            return ResponseEntity.badRequest().body(createErrorResponse("Product price is required."));
        }
        if (product.getPrice().compareTo(BigDecimal.ZERO) < 0) {
            return ResponseEntity.badRequest().body(createErrorResponse("Product price cannot be negative."));
        }
        if (product.getStockQuantity() == null) {
            return ResponseEntity.badRequest().body(createErrorResponse("Product stock quantity is required."));
        }
        if (product.getStockQuantity() < 0) {
            return ResponseEntity.badRequest().body(createErrorResponse("Product stock quantity cannot be negative."));
        }

        Product newProduct = new Product(
            product.getName().trim(),
            product.getDescription() != null ? product.getDescription().trim() : null,
            product.getPrice(),
            product.getStockQuantity()
        );
        Product savedProduct = productRepository.save(newProduct);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedProduct);
    }

    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts() {
        List<Product> products = productRepository.findAll();
        return ResponseEntity.ok(products);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProductById(@PathVariable Long id) {
        Optional<Product> optionalProduct = productRepository.findById(id);
        if (optionalProduct.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse("Product not found."));
        }
        return ResponseEntity.ok(optionalProduct.get());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProduct(@PathVariable Long id, @RequestBody Product product) {
        Optional<Product> optionalProduct = productRepository.findById(id);
        if (optionalProduct.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse("Product not found."));
        }

        if (product.getName() == null || product.getName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(createErrorResponse("Product name is required."));
        }
        if (product.getPrice() == null) {
            return ResponseEntity.badRequest().body(createErrorResponse("Product price is required."));
        }
        if (product.getPrice().compareTo(BigDecimal.ZERO) < 0) {
            return ResponseEntity.badRequest().body(createErrorResponse("Product price cannot be negative."));
        }
        if (product.getStockQuantity() == null) {
            return ResponseEntity.badRequest().body(createErrorResponse("Product stock quantity is required."));
        }
        if (product.getStockQuantity() < 0) {
            return ResponseEntity.badRequest().body(createErrorResponse("Product stock quantity cannot be negative."));
        }

        Product existingProduct = optionalProduct.get();
        existingProduct.setName(product.getName().trim());
        existingProduct.setDescription(product.getDescription() != null ? product.getDescription().trim() : null);
        existingProduct.setPrice(product.getPrice());
        existingProduct.setStockQuantity(product.getStockQuantity());

        Product updatedProduct = productRepository.save(existingProduct);
        return ResponseEntity.ok(updatedProduct);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable Long id) {
        Optional<Product> optionalProduct = productRepository.findById(id);
        if (optionalProduct.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse("Product not found."));
        }
        productRepository.delete(optionalProduct.get());
        Map<String, String> response = new HashMap<>();
        response.put("message", "Product deleted successfully.");
        return ResponseEntity.ok(response);
    }

    private Map<String, String> createErrorResponse(String message) {
        Map<String, String> errorMap = new HashMap<>();
        errorMap.put("error", message);
        return errorMap;
    }
}
