package com.forgeai.backend.service;

import com.forgeai.backend.dto.UpdateInventoryRequest;
import com.forgeai.backend.entity.Product;
import com.forgeai.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final InventoryService inventoryService;
    private final OrderItemRepository orderItemRepository;
    private final CartItemRepository cartItemRepository;
    private final WishlistItemRepository wishlistItemRepository;
    private final InventoryRepository inventoryRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;

    @Autowired
    public ProductService(ProductRepository productRepository,
                          InventoryService inventoryService,
                          OrderItemRepository orderItemRepository,
                          CartItemRepository cartItemRepository,
                          WishlistItemRepository wishlistItemRepository,
                          InventoryRepository inventoryRepository,
                          InventoryTransactionRepository inventoryTransactionRepository) {
        this.productRepository = productRepository;
        this.inventoryService = inventoryService;
        this.orderItemRepository = orderItemRepository;
        this.cartItemRepository = cartItemRepository;
        this.wishlistItemRepository = wishlistItemRepository;
        this.inventoryRepository = inventoryRepository;
        this.inventoryTransactionRepository = inventoryTransactionRepository;
    }

    @Transactional(readOnly = true)
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Product> getProductById(Long id) {
        return productRepository.findById(id);
    }

    @Transactional
    public Product createProduct(Product product) {
        validateProductPayload(product);

        if (product.getSku() != null && !product.getSku().trim().isEmpty()) {
            String trimmedSku = product.getSku().trim();
            if (productRepository.findBySku(trimmedSku).isPresent()) {
                throw new IllegalArgumentException("Product with SKU '" + trimmedSku + "' already exists.");
            }
        }

        Product newProduct = new Product(
                product.getName().trim(),
                product.getDescription() != null ? product.getDescription().trim() : null,
                product.getPrice(),
                product.getStockQuantity(),
                product.getCategory(),
                product.getBrand() != null ? product.getBrand().trim() : null,
                product.getSku() != null && !product.getSku().trim().isEmpty() ? product.getSku().trim() : null,
                product.getImageUrl() != null && !product.getImageUrl().trim().isEmpty() ? product.getImageUrl().trim() : null
        );

        if (product.getActive() != null) {
            newProduct.setActive(product.getActive());
        } else {
            newProduct.setActive(true);
        }

        Product savedProduct = productRepository.save(newProduct);

        // Synchronize Phase 4A inventory
        inventoryService.getOrCreateInventory(savedProduct);

        return savedProduct;
    }

    @Transactional
    public Product updateProduct(Long id, Product product) {
        Product existingProduct = productRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Product not found with id: " + id));

        validateProductPayload(product);

        if (product.getSku() != null && !product.getSku().trim().isEmpty()) {
            String trimmedSku = product.getSku().trim();
            Optional<Product> skuMatch = productRepository.findBySku(trimmedSku);
            if (skuMatch.isPresent() && !skuMatch.get().getId().equals(id)) {
                throw new IllegalArgumentException("Product with SKU '" + trimmedSku + "' already exists on another product.");
            }
        }

        existingProduct.setName(product.getName().trim());
        existingProduct.setDescription(product.getDescription() != null ? product.getDescription().trim() : null);
        existingProduct.setPrice(product.getPrice());
        existingProduct.setCategory(product.getCategory());
        existingProduct.setBrand(product.getBrand() != null ? product.getBrand().trim() : null);
        existingProduct.setSku(product.getSku() != null && !product.getSku().trim().isEmpty() ? product.getSku().trim() : null);
        existingProduct.setImageUrl(product.getImageUrl() != null && !product.getImageUrl().trim().isEmpty() ? product.getImageUrl().trim() : null);

        if (product.getActive() != null) {
            existingProduct.setActive(product.getActive());
        }

        // Sync stock quantity change through inventory service
        if (existingProduct.getStockQuantity() == null || !existingProduct.getStockQuantity().equals(product.getStockQuantity())) {
            existingProduct.setStockQuantity(product.getStockQuantity());
            inventoryService.updateInventory(existingProduct.getId(), new UpdateInventoryRequest(null, product.getStockQuantity()));
        }

        return productRepository.save(existingProduct);
    }

    @Transactional
    public Product updateProductStatus(Long id, Boolean active) {
        Product existingProduct = productRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Product not found with id: " + id));

        existingProduct.setActive(active != null ? active : true);
        return productRepository.save(existingProduct);
    }

    @Transactional
    public Map<String, Object> deleteProduct(Long id) {
        Product existingProduct = productRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Product not found with id: " + id));

        // Check if product is referenced in historical orders
        boolean hasOrderHistory = orderItemRepository.existsByProductId(id);

        Map<String, Object> result = new HashMap<>();
        if (hasOrderHistory) {
            // Unsafe to hard delete due to foreign key constraints and audit history.
            // Safely deactivate the product as the safe alternative.
            existingProduct.setActive(false);
            productRepository.save(existingProduct);

            result.put("message", "Product has associated order history and cannot be permanently deleted. It has been deactivated to preserve data integrity.");
            result.put("deactivated", true);
            result.put("deleted", false);
            result.put("productId", id);
        } else {
            // Product has no orders. Safely clean up child references and hard delete.
            cartItemRepository.deleteByProductId(id);
            wishlistItemRepository.deleteByProductId(id);
            inventoryTransactionRepository.deleteByProductId(id);
            inventoryRepository.deleteByProductId(id);
            productRepository.delete(existingProduct);

            result.put("message", "Product deleted successfully.");
            result.put("deactivated", false);
            result.put("deleted", true);
            result.put("productId", id);
        }

        return result;
    }

    private void validateProductPayload(Product product) {
        if (product.getName() == null || product.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Product name is required.");
        }
        if (product.getPrice() == null) {
            throw new IllegalArgumentException("Product price is required.");
        }
        if (product.getPrice().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Product price cannot be negative.");
        }
        if (product.getStockQuantity() == null) {
            throw new IllegalArgumentException("Product stock quantity is required.");
        }
        if (product.getStockQuantity() < 0) {
            throw new IllegalArgumentException("Product stock quantity cannot be negative.");
        }
        if (product.getCategory() == null) {
            throw new IllegalArgumentException("Product category is required.");
        }
    }
}
