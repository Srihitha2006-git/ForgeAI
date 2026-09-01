package com.forgeai.backend.controller;

import com.forgeai.backend.dto.*;
import com.forgeai.backend.entity.*;
import com.forgeai.backend.repository.*;
import jakarta.servlet.http.HttpServletRequest;
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
@RequestMapping("/api/cart")
public class CartController {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;

    @Autowired
    public CartController(UserRepository userRepository,
                          ProductRepository productRepository,
                          CartRepository cartRepository,
                          CartItemRepository cartItemRepository) {
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
    }

    private Long getAuthenticatedUserId(HttpServletRequest request) {
        Object attr = request.getAttribute("authenticatedUserId");
        if (attr instanceof Long) {
            return (Long) attr;
        }
        return null;
    }

    private Cart getOrCreateCartForUser(User user) {
        return cartRepository.findByUser(user)
                .orElseGet(() -> cartRepository.save(new Cart(user)));
    }

    private CartResponse convertToCartResponse(Cart cart) {
        List<CartItemResponse> itemResponses = cart.getItems().stream().map(item -> {
            BigDecimal price = item.getProduct().getPrice();
            BigDecimal subtotal = price.multiply(BigDecimal.valueOf(item.getQuantity()));
            return new CartItemResponse(
                item.getId(),
                item.getProduct(),
                item.getQuantity(),
                subtotal
            );
        }).toList();

        BigDecimal subtotal = itemResponses.stream()
            .map(CartItemResponse::getSubtotal)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new CartResponse(
            cart.getId(),
            itemResponses,
            subtotal,
            subtotal // Total = Subtotal
        );
    }

    private Map<String, String> createErrorResponse(String message) {
        Map<String, String> errorMap = new HashMap<>();
        errorMap.put("error", message);
        return errorMap;
    }

    @GetMapping
    public ResponseEntity<?> getCart(HttpServletRequest request) {
        Long userId = getAuthenticatedUserId(request);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(createErrorResponse("Unauthorized: User not authenticated."));
        }

        Optional<User> optionalUser = userRepository.findById(userId);
        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse("User not found."));
        }

        Cart cart = getOrCreateCartForUser(optionalUser.get());
        return ResponseEntity.ok(convertToCartResponse(cart));
    }

    @PostMapping("/items")
    public ResponseEntity<?> addItemToCart(@RequestBody AddToCartRequest req, HttpServletRequest request) {
        Long userId = getAuthenticatedUserId(request);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(createErrorResponse("Unauthorized: User not authenticated."));
        }

        if (req.getProductId() == null) {
            return ResponseEntity.badRequest().body(createErrorResponse("Product ID is required."));
        }

        if (req.getQuantity() == null || req.getQuantity() < 1) {
            return ResponseEntity.badRequest().body(createErrorResponse("Quantity must be at least 1."));
        }

        Optional<User> optionalUser = userRepository.findById(userId);
        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse("User not found."));
        }

        Optional<Product> optionalProduct = productRepository.findById(req.getProductId());
        if (optionalProduct.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse("Product not found."));
        }

        Product product = optionalProduct.get();
        if (product.getActive() == null || !product.getActive()) {
            return ResponseEntity.badRequest().body(createErrorResponse("Product is inactive."));
        }

        Cart cart = getOrCreateCartForUser(optionalUser.get());

        Optional<CartItem> optionalCartItem = cartItemRepository.findByCartIdAndProductId(cart.getId(), product.getId());

        int currentQuantityInCart = optionalCartItem.map(CartItem::getQuantity).orElse(0);
        int targetQuantity = currentQuantityInCart + req.getQuantity();

        if (targetQuantity > product.getStockQuantity()) {
            return ResponseEntity.badRequest().body(createErrorResponse("Requested quantity exceeds available stock."));
        }

        CartItem cartItem;
        if (optionalCartItem.isPresent()) {
            cartItem = optionalCartItem.get();
            cartItem.setQuantity(targetQuantity);
        } else {
            cartItem = new CartItem(cart, product, targetQuantity);
            cart.getItems().add(cartItem);
        }

        cartItemRepository.save(cartItem);
        cartRepository.save(cart);

        return ResponseEntity.ok(convertToCartResponse(cart));
    }

    @PutMapping("/items/{itemId}")
    public ResponseEntity<?> updateCartItem(@PathVariable Long itemId, @RequestBody UpdateCartItemRequest req, HttpServletRequest request) {
        Long userId = getAuthenticatedUserId(request);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(createErrorResponse("Unauthorized: User not authenticated."));
        }

        if (req.getQuantity() == null || req.getQuantity() < 1) {
            return ResponseEntity.badRequest().body(createErrorResponse("Quantity must be at least 1."));
        }

        Optional<CartItem> optionalCartItem = cartItemRepository.findById(itemId);
        if (optionalCartItem.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse("Cart item not found."));
        }

        CartItem cartItem = optionalCartItem.get();
        Cart cart = cartItem.getCart();

        if (!cart.getUser().getId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(createErrorResponse("Unauthorized access."));
        }

        Product product = cartItem.getProduct();
        if (req.getQuantity() > product.getStockQuantity()) {
            return ResponseEntity.badRequest().body(createErrorResponse("Requested quantity exceeds available stock."));
        }

        cartItem.setQuantity(req.getQuantity());
        cartItemRepository.save(cartItem);

        // Refresh cart representation
        Cart updatedCart = cartRepository.findById(cart.getId()).orElse(cart);
        return ResponseEntity.ok(convertToCartResponse(updatedCart));
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<?> removeCartItem(@PathVariable Long itemId, HttpServletRequest request) {
        Long userId = getAuthenticatedUserId(request);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(createErrorResponse("Unauthorized: User not authenticated."));
        }

        Optional<CartItem> optionalCartItem = cartItemRepository.findById(itemId);
        if (optionalCartItem.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse("Cart item not found."));
        }

        CartItem cartItem = optionalCartItem.get();
        Cart cart = cartItem.getCart();

        if (!cart.getUser().getId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(createErrorResponse("Unauthorized access."));
        }

        cart.getItems().remove(cartItem);
        cartItemRepository.delete(cartItem);
        cartRepository.save(cart);

        return ResponseEntity.ok(convertToCartResponse(cart));
    }

    @DeleteMapping
    public ResponseEntity<?> clearCart(HttpServletRequest request) {
        Long userId = getAuthenticatedUserId(request);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(createErrorResponse("Unauthorized: User not authenticated."));
        }

        Optional<User> optionalUser = userRepository.findById(userId);
        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse("User not found."));
        }

        Cart cart = getOrCreateCartForUser(optionalUser.get());
        cart.getItems().clear();
        cartRepository.save(cart);

        return ResponseEntity.ok(convertToCartResponse(cart));
    }
}
