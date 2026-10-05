package com.forgeai.backend.service;

import com.forgeai.backend.dto.*;
import com.forgeai.backend.entity.*;
import com.forgeai.backend.repository.InventoryRepository;
import com.forgeai.backend.repository.InventoryTransactionRepository;
import com.forgeai.backend.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;
    private final ProductRepository productRepository;

    @Autowired
    public InventoryService(InventoryRepository inventoryRepository,
                            InventoryTransactionRepository inventoryTransactionRepository,
                            ProductRepository productRepository) {
        this.inventoryRepository = inventoryRepository;
        this.inventoryTransactionRepository = inventoryTransactionRepository;
        this.productRepository = productRepository;
    }

    public InventoryResponse convertToInventoryResponse(Inventory inventory) {
        Product p = inventory.getProduct();
        return new InventoryResponse(
                inventory.getId(),
                p != null ? p.getId() : null,
                p != null ? p.getName() : null,
                p != null ? p.getSku() : null,
                inventory.getAvailableStock(),
                inventory.getReservedStock(),
                inventory.getSoldStock(),
                inventory.getLowStockThreshold(),
                inventory.getStatus(),
                inventory.getUpdatedAt() != null ? inventory.getUpdatedAt() : inventory.getCreatedAt()
        );
    }

    public InventoryTransactionResponse convertToTransactionResponse(InventoryTransaction transaction) {
        Product p = transaction.getProduct();
        return new InventoryTransactionResponse(
                transaction.getId(),
                p != null ? p.getId() : null,
                p != null ? p.getName() : null,
                transaction.getTransactionType(),
                transaction.getQuantity(),
                transaction.getPreviousAvailableStock(),
                transaction.getNewAvailableStock(),
                transaction.getReason(),
                transaction.getCreatedAt()
        );
    }

    @Transactional
    public Inventory getOrCreateInventory(Product product) {
        Optional<Inventory> existing = inventoryRepository.findByProduct(product);
        if (existing.isPresent()) {
            return existing.get();
        }

        int initialStock = product.getStockQuantity() != null ? product.getStockQuantity() : 0;
        Inventory newInventory = new Inventory(product, initialStock, 10);
        Inventory saved = inventoryRepository.save(newInventory);

        // Record initial STOCK_IN transaction if stock > 0
        if (initialStock > 0) {
            InventoryTransaction initialTx = new InventoryTransaction(
                    product,
                    InventoryTransactionType.STOCK_IN,
                    initialStock,
                    0,
                    initialStock,
                    "Initial stock synchronization"
            );
            inventoryTransactionRepository.save(initialTx);
        }

        return saved;
    }

    @Transactional(readOnly = true)
    public List<InventoryResponse> getAllInventories() {
        List<Product> products = productRepository.findAll();
        List<InventoryResponse> responses = new ArrayList<>();

        for (Product product : products) {
            Inventory inventory = inventoryRepository.findByProduct(product)
                    .orElseGet(() -> {
                        int initialStock = product.getStockQuantity() != null ? product.getStockQuantity() : 0;
                        Inventory inv = new Inventory(product, initialStock, 10);
                        return inventoryRepository.save(inv);
                    });
            responses.add(convertToInventoryResponse(inventory));
        }

        return responses;
    }

    @Transactional(readOnly = true)
    public Optional<InventoryResponse> getInventoryByProductId(Long productId) {
        Optional<Product> optionalProduct = productRepository.findById(productId);
        if (optionalProduct.isEmpty()) {
            return Optional.empty();
        }

        Product product = optionalProduct.get();
        Inventory inventory = inventoryRepository.findByProduct(product)
                .orElseGet(() -> {
                    int initialStock = product.getStockQuantity() != null ? product.getStockQuantity() : 0;
                    Inventory inv = new Inventory(product, initialStock, 10);
                    return inventoryRepository.save(inv);
                });

        return Optional.of(convertToInventoryResponse(inventory));
    }

    @Transactional
    public InventoryResponse adjustStock(Long productId, Integer quantityChange, String reason, InventoryTransactionType transactionType) {
        if (quantityChange == null || quantityChange == 0) {
            throw new IllegalArgumentException("Adjustment quantity must be non-zero.");
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + productId));

        Inventory inventory = getOrCreateInventory(product);

        int previousStock = inventory.getAvailableStock() != null ? inventory.getAvailableStock() : 0;
        int newStock = previousStock + quantityChange;

        if (newStock < 0) {
            throw new IllegalArgumentException("Adjustment would result in negative available stock (current: "
                    + previousStock + ", adjustment: " + quantityChange + ").");
        }

        inventory.setAvailableStock(newStock);
        Inventory savedInventory = inventoryRepository.save(inventory);

        // Keep product stockQuantity synchronized for backward compatibility
        product.setStockQuantity(newStock);
        productRepository.save(product);

        InventoryTransactionType effectiveType = transactionType != null ? transactionType :
                (quantityChange > 0 ? InventoryTransactionType.ADJUSTMENT : InventoryTransactionType.STOCK_OUT);

        String effectiveReason = (reason != null && !reason.trim().isEmpty())
                ? reason.trim()
                : "Manual stock adjustment: " + (quantityChange > 0 ? "+" : "") + quantityChange;

        InventoryTransaction tx = new InventoryTransaction(
                product,
                effectiveType,
                quantityChange,
                previousStock,
                newStock,
                effectiveReason
        );
        inventoryTransactionRepository.save(tx);

        return convertToInventoryResponse(savedInventory);
    }

    @Transactional
    public InventoryResponse updateInventory(Long productId, UpdateInventoryRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + productId));

        Inventory inventory = getOrCreateInventory(product);

        if (request.getLowStockThreshold() != null) {
            if (request.getLowStockThreshold() < 0) {
                throw new IllegalArgumentException("Low stock threshold cannot be negative.");
            }
            inventory.setLowStockThreshold(request.getLowStockThreshold());
        }

        if (request.getAvailableStock() != null) {
            if (request.getAvailableStock() < 0) {
                throw new IllegalArgumentException("Available stock cannot be negative.");
            }
            int previousStock = inventory.getAvailableStock() != null ? inventory.getAvailableStock() : 0;
            int newStock = request.getAvailableStock();
            int diff = newStock - previousStock;

            if (diff != 0) {
                inventory.setAvailableStock(newStock);
                product.setStockQuantity(newStock);
                productRepository.save(product);

                InventoryTransaction tx = new InventoryTransaction(
                        product,
                        InventoryTransactionType.ADJUSTMENT,
                        diff,
                        previousStock,
                        newStock,
                        "Direct inventory update override"
                );
                inventoryTransactionRepository.save(tx);
            }
        }

        Inventory saved = inventoryRepository.save(inventory);
        return convertToInventoryResponse(saved);
    }

    @Transactional
    public void commitSoldStock(Product product, int quantity, String reason) {
        if (quantity <= 0) return;

        Inventory inventory = getOrCreateInventory(product);
        int previousStock = inventory.getAvailableStock() != null ? inventory.getAvailableStock() : 0;

        if (previousStock < quantity) {
            throw new IllegalStateException("Insufficient stock for " + product.getName() +
                    ". Available: " + previousStock + ", Requested: " + quantity);
        }

        int newStock = previousStock - quantity;
        inventory.setAvailableStock(newStock);
        inventory.setSoldStock((inventory.getSoldStock() != null ? inventory.getSoldStock() : 0) + quantity);
        inventoryRepository.save(inventory);

        product.setStockQuantity(newStock);
        productRepository.save(product);

        InventoryTransaction tx = new InventoryTransaction(
                product,
                InventoryTransactionType.SALE,
                -quantity,
                previousStock,
                newStock,
                reason != null ? reason : "Product sold in order"
        );
        inventoryTransactionRepository.save(tx);
    }

    @Transactional
    public void restockFromCancelledOrder(Product product, int quantity, String reason) {
        if (quantity <= 0) return;

        Inventory inventory = getOrCreateInventory(product);
        int previousStock = inventory.getAvailableStock() != null ? inventory.getAvailableStock() : 0;
        int newStock = previousStock + quantity;

        inventory.setAvailableStock(newStock);
        int currentSold = inventory.getSoldStock() != null ? inventory.getSoldStock() : 0;
        inventory.setSoldStock(Math.max(0, currentSold - quantity));
        inventoryRepository.save(inventory);

        product.setStockQuantity(newStock);
        productRepository.save(product);

        InventoryTransaction tx = new InventoryTransaction(
                product,
                InventoryTransactionType.RELEASE,
                quantity,
                previousStock,
                newStock,
                reason != null ? reason : "Restocked from cancelled order"
        );
        inventoryTransactionRepository.save(tx);
    }

    @Transactional(readOnly = true)
    public List<InventoryTransactionResponse> getTransactionsByProductId(Long productId) {
        if (!productRepository.existsById(productId)) {
            throw new IllegalArgumentException("Product not found with id: " + productId);
        }

        List<InventoryTransaction> transactions = inventoryTransactionRepository.findByProductIdOrderByCreatedAtDesc(productId);
        return transactions.stream()
                .map(this::convertToTransactionResponse)
                .collect(Collectors.toList());
    }
}
