package com.forgeai.backend.controller;

import com.forgeai.backend.dto.AddressRequest;
import com.forgeai.backend.dto.AddressResponse;
import com.forgeai.backend.entity.Address;
import com.forgeai.backend.entity.User;
import com.forgeai.backend.repository.AddressRepository;
import com.forgeai.backend.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/addresses")
public class AddressController {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    @Autowired
    public AddressController(AddressRepository addressRepository, UserRepository userRepository) {
        this.addressRepository = addressRepository;
        this.userRepository = userRepository;
    }

    private Long getAuthenticatedUserId(HttpServletRequest request) {
        Object attr = request.getAttribute("authenticatedUserId");
        if (attr instanceof Long) {
            return (Long) attr;
        }
        return null;
    }

    private AddressResponse convertToAddressResponse(Address address) {
        return new AddressResponse(
                address.getId(),
                address.getFullName(),
                address.getPhone(),
                address.getAddressLine1(),
                address.getAddressLine2(),
                address.getCity(),
                address.getState(),
                address.getPostalCode(),
                address.getCountry(),
                address.getAddressType(),
                address.getIsDefault()
        );
    }

    private Map<String, String> createErrorResponse(String message) {
        Map<String, String> errorMap = new HashMap<>();
        errorMap.put("error", message);
        return errorMap;
    }

    private ResponseEntity<?> validateRequest(AddressRequest req) {
        if (req.getFullName() == null || req.getFullName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(createErrorResponse("Full name is required."));
        }
        if (req.getFullName().trim().length() < 2 || req.getFullName().trim().length() > 100) {
            return ResponseEntity.badRequest().body(createErrorResponse("Full name must be between 2 and 100 characters."));
        }
        if (req.getPhone() == null || req.getPhone().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(createErrorResponse("Phone number is required."));
        }
        String cleanedPhone = req.getPhone().trim();
        if (!cleanedPhone.matches("^[+]?[0-9\\s\\-()]{10,15}$")) {
            return ResponseEntity.badRequest().body(createErrorResponse("Invalid phone number format. It must be 10-15 digits."));
        }
        if (req.getAddressLine1() == null || req.getAddressLine1().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(createErrorResponse("Address Line 1 is required."));
        }
        if (req.getCity() == null || req.getCity().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(createErrorResponse("City is required."));
        }
        if (req.getState() == null || req.getState().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(createErrorResponse("State is required."));
        }
        if (req.getPostalCode() == null || req.getPostalCode().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(createErrorResponse("Postal code is required."));
        }
        if (req.getCountry() == null || req.getCountry().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(createErrorResponse("Country is required."));
        }

        if ("India".equalsIgnoreCase(req.getCountry().trim())) {
            if (!req.getPostalCode().trim().matches("^\\d{6}$")) {
                return ResponseEntity.badRequest().body(createErrorResponse("Postal code for India must be exactly 6 digits."));
            }
        } else {
            if (req.getPostalCode().trim().length() < 3 || req.getPostalCode().trim().length() > 10) {
                return ResponseEntity.badRequest().body(createErrorResponse("Postal code must be between 3 and 10 characters."));
            }
        }

        if (req.getAddressType() == null) {
            return ResponseEntity.badRequest().body(createErrorResponse("Address Type is required."));
        }

        return null;
    }

    @GetMapping
    public ResponseEntity<?> getAddresses(HttpServletRequest request) {
        Long userId = getAuthenticatedUserId(request);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(createErrorResponse("Unauthorized: User not authenticated."));
        }

        List<Address> addresses = addressRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<AddressResponse> responses = addresses.stream()
                .map(this::convertToAddressResponse)
                .toList();

        return ResponseEntity.ok(responses);
    }

    @PostMapping
    public ResponseEntity<?> addAddress(@RequestBody AddressRequest req, HttpServletRequest request) {
        Long userId = getAuthenticatedUserId(request);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(createErrorResponse("Unauthorized: User not authenticated."));
        }

        ResponseEntity<?> validationError = validateRequest(req);
        if (validationError != null) {
            return validationError;
        }

        Optional<User> optionalUser = userRepository.findById(userId);
        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse("User not found."));
        }

        User user = optionalUser.get();
        List<Address> existingAddresses = addressRepository.findByUserId(userId);
        boolean isFirst = existingAddresses.isEmpty();
        boolean makeDefault = isFirst || (req.getIsDefault() != null && req.getIsDefault());

        if (makeDefault && !isFirst) {
            for (Address addr : existingAddresses) {
                if (addr.getIsDefault()) {
                    addr.setIsDefault(false);
                    addressRepository.save(addr);
                }
            }
        }

        Address address = new Address(
                user,
                req.getFullName().trim(),
                req.getPhone().trim(),
                req.getAddressLine1().trim(),
                req.getAddressLine2() != null ? req.getAddressLine2().trim() : null,
                req.getCity().trim(),
                req.getState().trim(),
                req.getPostalCode().trim(),
                req.getCountry().trim(),
                req.getAddressType(),
                makeDefault
        );

        Address saved = addressRepository.save(address);
        return ResponseEntity.status(HttpStatus.CREATED).body(convertToAddressResponse(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAddress(@PathVariable Long id, @RequestBody AddressRequest req, HttpServletRequest request) {
        Long userId = getAuthenticatedUserId(request);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(createErrorResponse("Unauthorized: User not authenticated."));
        }

        ResponseEntity<?> validationError = validateRequest(req);
        if (validationError != null) {
            return validationError;
        }

        Optional<Address> optionalAddress = addressRepository.findById(id);
        if (optionalAddress.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse("Address not found."));
        }

        Address address = optionalAddress.get();
        if (!address.getUser().getId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(createErrorResponse("Unauthorized access: You do not own this address."));
        }

        boolean makeDefault = req.getIsDefault() != null && req.getIsDefault();

        if (makeDefault && !address.getIsDefault()) {
            List<Address> otherAddresses = addressRepository.findByUserId(userId);
            for (Address addr : otherAddresses) {
                if (!addr.getId().equals(id) && addr.getIsDefault()) {
                    addr.setIsDefault(false);
                    addressRepository.save(addr);
                }
            }
        } else if (!makeDefault && address.getIsDefault()) {
            List<Address> otherAddresses = addressRepository.findByUserId(userId);
            if (otherAddresses.size() > 1) {
                Optional<Address> firstOther = otherAddresses.stream().filter(a -> !a.getId().equals(id)).findFirst();
                if (firstOther.isPresent()) {
                    Address other = firstOther.get();
                    other.setIsDefault(true);
                    addressRepository.save(other);
                }
            } else {
                makeDefault = true;
            }
        }

        address.setFullName(req.getFullName().trim());
        address.setPhone(req.getPhone().trim());
        address.setAddressLine1(req.getAddressLine1().trim());
        address.setAddressLine2(req.getAddressLine2() != null ? req.getAddressLine2().trim() : null);
        address.setCity(req.getCity().trim());
        address.setState(req.getState().trim());
        address.setPostalCode(req.getPostalCode().trim());
        address.setCountry(req.getCountry().trim());
        address.setAddressType(req.getAddressType());
        address.setIsDefault(makeDefault);

        Address updated = addressRepository.save(address);
        return ResponseEntity.ok(convertToAddressResponse(updated));
    }

    @PutMapping("/{id}/default")
    public ResponseEntity<?> setDefaultAddress(@PathVariable Long id, HttpServletRequest request) {
        Long userId = getAuthenticatedUserId(request);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(createErrorResponse("Unauthorized: User not authenticated."));
        }

        Optional<Address> optionalAddress = addressRepository.findById(id);
        if (optionalAddress.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse("Address not found."));
        }

        Address address = optionalAddress.get();
        if (!address.getUser().getId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(createErrorResponse("Unauthorized access: You do not own this address."));
        }

        if (!address.getIsDefault()) {
            List<Address> otherAddresses = addressRepository.findByUserId(userId);
            for (Address addr : otherAddresses) {
                if (addr.getIsDefault()) {
                    addr.setIsDefault(false);
                    addressRepository.save(addr);
                }
            }
            address.setIsDefault(true);
            address = addressRepository.save(address);
        }

        return ResponseEntity.ok(convertToAddressResponse(address));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAddress(@PathVariable Long id, HttpServletRequest request) {
        Long userId = getAuthenticatedUserId(request);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(createErrorResponse("Unauthorized: User not authenticated."));
        }

        Optional<Address> optionalAddress = addressRepository.findById(id);
        if (optionalAddress.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse("Address not found."));
        }

        Address address = optionalAddress.get();
        if (!address.getUser().getId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(createErrorResponse("Unauthorized access: You do not own this address."));
        }

        boolean wasDefault = address.getIsDefault();
        addressRepository.delete(address);

        if (wasDefault) {
            List<Address> remaining = addressRepository.findByUserIdOrderByCreatedAtDesc(userId);
            if (!remaining.isEmpty()) {
                Address newDefault = remaining.get(0);
                newDefault.setIsDefault(true);
                addressRepository.save(newDefault);
            }
        }

        Map<String, String> response = new HashMap<>();
        response.put("message", "Address deleted successfully");
        return ResponseEntity.ok(response);
    }
}
