package com.forgeai.backend.controller;

import com.forgeai.backend.dto.*;
import com.forgeai.backend.service.InventoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    @Autowired
    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    private Map<String, String> createErrorResponse(String message) {
        Map<String, String> errorMap = new HashMap<>();
        errorMap.put("error", message);
        return errorMap;
    }

    @GetMapping
    public ResponseEntity<List<InventoryResponse>> getAllInventory() {
        List<InventoryResponse> list = inventoryService.getAllInventories();
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{productId}")
    public ResponseEntity<?> getInventoryByProductId(@PathVariable Long productId) {
        Optional<InventoryResponse> inventory = inventoryService.getInventoryByProductId(productId);
        if (inventory.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("Product or inventory not found for id: " + productId));
        }
        return ResponseEntity.ok(inventory.get());
    }

    @PutMapping("/{productId}")
    public ResponseEntity<?> updateInventory(@PathVariable Long productId, @RequestBody UpdateInventoryRequest request) {
        try {
            InventoryResponse response = inventoryService.updateInventory(productId, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            if (e.getMessage() != null && e.getMessage().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse(e.getMessage()));
            }
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("An error occurred while updating inventory."));
        }
    }

    @PostMapping("/{productId}/adjust")
    public ResponseEntity<?> adjustStock(@PathVariable Long productId, @RequestBody StockAdjustmentRequest request) {
        Integer quantity = request.getEffectiveQuantity();
        if (quantity == null) {
            return ResponseEntity.badRequest().body(createErrorResponse("Adjustment quantity is required."));
        }
        if (quantity == 0) {
            return ResponseEntity.badRequest().body(createErrorResponse("Adjustment quantity must be non-zero."));
        }

        try {
            InventoryResponse response = inventoryService.adjustStock(
                    productId,
                    quantity,
                    request.getReason(),
                    null
            );
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            if (e.getMessage() != null && e.getMessage().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse(e.getMessage()));
            }
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("An error occurred while adjusting stock."));
        }
    }

    @GetMapping("/{productId}/transactions")
    public ResponseEntity<?> getTransactions(@PathVariable Long productId) {
        try {
            List<InventoryTransactionResponse> list = inventoryService.getTransactionsByProductId(productId);
            return ResponseEntity.ok(list);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("An error occurred while fetching transactions."));
        }
    }
}
