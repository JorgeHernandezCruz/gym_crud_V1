<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: access");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Establecer zona horaria correcta para México/Centro
date_default_timezone_set('America/Mexico_City');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$host = "localhost";
$username = "root"; // Usuario por defecto de XAMPP
$password = ""; // Contraseña por defecto de XAMPP
$database = "gym_crud";

$conn = new mysqli($host, $username, $password, $database);

if ($conn->connect_error) {
    die(json_encode(["success" => false, "message" => "Conexión fallida: " . $conn->connect_error]));
}

// Helper function to send JSON response
function sendResponse($success, $message, $data = null) {
    echo json_encode(["success" => $success, "message" => $message, "data" => $data]);
    exit();
}

// Obtener la acción requerida de la URL (ej: api.php?action=getUsers)
$action = isset($_GET['action']) ? $_GET['action'] : '';
$method = $_SERVER['REQUEST_METHOD'];

// Leer datos en formato JSON desde React (Frontend)
$data = json_decode(file_get_contents("php://input"));

switch($action) {
    case 'getUsers':
        if ($method === 'GET') {
            $sql = "SELECT u.*, p.name as promotion_name, p.discount_percentage, p.valid_from as promotion_valid_from, p.valid_until as promotion_valid_until 
                    FROM users u 
                    LEFT JOIN promotions p ON u.promotion_id = p.id";
            $result = $conn->query($sql);
            $users = [];
            while($row = $result->fetch_assoc()) {
                $users[] = $row;
            }
            sendResponse(true, "Usuarios obtenidos", $users);
        }
        break;

    case 'addUser':
        if ($method === 'POST' && isset($data->name)) {
            $name = $conn->real_escape_string($data->name);
            $last_name = isset($data->last_name) ? $conn->real_escape_string($data->last_name) : '';
            $phone = $conn->real_escape_string($data->phone);
            $emergencyContact = $conn->real_escape_string($data->emergencyContact);
            $subscriptionType = $conn->real_escape_string($data->subscriptionType);
            
            $promotionId = isset($data->promotion_id) && $data->promotion_id !== null ? (int)$data->promotion_id : "NULL";

            // Generar ID
            $result = $conn->query("SELECT id FROM users ORDER BY CAST(id AS UNSIGNED) DESC LIMIT 1");
            $maxId = $result->num_rows > 0 ? (int)$result->fetch_assoc()['id'] : 0;
            $newId = (string)($maxId + 1);

            // Calcular expiración
            $createdAt = date('Y-m-d H:i:s');
            if ($subscriptionType === 'annual') {
                $expirationDate = date('Y-m-d H:i:s', strtotime('+1 year'));
            } else {
                $expirationDate = date('Y-m-d H:i:s', strtotime('+1 month'));
            }

            $sql = "INSERT INTO users (id, name, last_name, phone, emergencyContact, subscriptionType, createdAt, expirationDate, promotion_id) 
                    VALUES ('$newId', '$name', '$last_name', '$phone', '$emergencyContact', '$subscriptionType', '$createdAt', '$expirationDate', $promotionId)";
            
            if ($conn->query($sql) === TRUE) {
                // Return the inserted user so React can update its state
                $newUser = [
                    "id" => $newId,
                    "name" => $name,
                    "last_name" => $last_name,
                    "phone" => $phone,
                    "emergencyContact" => $emergencyContact,
                    "subscriptionType" => $subscriptionType,
                    "createdAt" => $createdAt,
                    "expirationDate" => $expirationDate
                ];
                sendResponse(true, "Usuario agregado exitosamente", $newUser);
            } else {
                sendResponse(false, "Error al agregar usuario: " . $conn->error);
            }
        }
        break;
        
    case 'deleteUser':
         if ($method === 'DELETE' && isset($_GET['id'])) {
            $id = $conn->real_escape_string($_GET['id']);
            if ($conn->query("DELETE FROM users WHERE id='$id'") === TRUE) {
                sendResponse(true, "Usuario eliminado", $id);
            } else {
                sendResponse(false, "Error eliminando usuario");
            }
         }
         break;

    case 'updateUser':
         if ($method === 'PUT' && isset($data->id)) {
            $id = $conn->real_escape_string($data->id);
            $name = $conn->real_escape_string($data->name);
            $last_name = isset($data->last_name) ? $conn->real_escape_string($data->last_name) : '';
            $phone = $conn->real_escape_string($data->phone);
            $emergencyContact = $conn->real_escape_string($data->emergencyContact);
            $promotionId = isset($data->promotion_id) && $data->promotion_id !== null ? (int)$data->promotion_id : "NULL";

            // Note: Subscription type shouldn't change generally, but updating what's allowed.
            $sql = "UPDATE users SET name='$name', last_name='$last_name', phone='$phone', emergencyContact='$emergencyContact', promotion_id=$promotionId WHERE id='$id'";
            if ($conn->query($sql) === TRUE) {
                sendResponse(true, "Usuario actualizado exitosamente");
            } else {
                sendResponse(false, "Error actualizando usuario");
            }
         }
         break;

    case 'renewUser':
        if ($method === 'PUT' && isset($data->id) && isset($data->subscriptionType)) {
            $id = $conn->real_escape_string($data->id);
            $subscriptionType = $conn->real_escape_string($data->subscriptionType);

            // Calcular fechas actualizadas
            $createdAt = date('Y-m-d H:i:s');
            if ($subscriptionType === 'annual') {
                $expirationDate = date('Y-m-d H:i:s', strtotime('+1 year'));
            } else {
                $expirationDate = date('Y-m-d H:i:s', strtotime('+1 month'));
            }

            $sql = "UPDATE users SET createdAt='$createdAt', expirationDate='$expirationDate', subscriptionType='$subscriptionType' WHERE id='$id'";
            if ($conn->query($sql) === TRUE) {
                // Return updated dates explicitly to update frontend state 
                $renewedData = [
                    "id" => $id,
                    "createdAt" => $createdAt,
                    "expirationDate" => $expirationDate,
                    "subscriptionType" => $subscriptionType
                ];
                sendResponse(true, "Suscripción renovada exitosamente", $renewedData);
            } else {
                sendResponse(false, "Error al renovar usuario: " . $conn->error);
            }
        }
        break;

    case 'getPromotions':
        if ($method === 'GET') {
            $result = $conn->query("SELECT * FROM promotions ORDER BY name ASC");
            $promotions = [];
            while($row = $result->fetch_assoc()) {
                $promotions[] = $row;
            }
            sendResponse(true, "Promociones obtenidas", $promotions);
        }
        break;

    case 'addPromotion':
        if ($method === 'POST' && isset($data->name) && isset($data->discount_percentage)) {
            $name = $conn->real_escape_string($data->name);
            $discount_percentage = (int)$data->discount_percentage;
            $valid_from = isset($data->valid_from) ? "'" . $conn->real_escape_string($data->valid_from) . "'" : "NULL";
            $valid_until = isset($data->valid_until) ? "'" . $conn->real_escape_string($data->valid_until) . "'" : "NULL";
            
            $sql = "INSERT INTO promotions (name, discount_percentage, valid_from, valid_until) VALUES ('$name', $discount_percentage, $valid_from, $valid_until)";
            if ($conn->query($sql) === TRUE) {
                $newId = $conn->insert_id;
                $newPromotion = [
                    "id" => $newId,
                    "name" => $name,
                    "discount_percentage" => $discount_percentage,
                    "valid_from" => isset($data->valid_from) ? $data->valid_from : null,
                    "valid_until" => isset($data->valid_until) ? $data->valid_until : null
                ];
                sendResponse(true, "Promoción agregada exitosamente", $newPromotion);
            } else {
                sendResponse(false, "Error al agregar promoción: " . $conn->error);
            }
        }
        break;

    case 'deletePromotion':
        if ($method === 'DELETE' && isset($_GET['id'])) {
            $id = (int)$_GET['id'];
            if ($conn->query("DELETE FROM promotions WHERE id=$id") === TRUE) {
                $conn->query("UPDATE users SET promotion_id = NULL WHERE promotion_id = $id"); // Nullify references
                sendResponse(true, "Promoción eliminada", $id);
            } else {
                sendResponse(false, "Error eliminando promoción");
            }
        }
        break;

    case 'getVisits':
        if ($method === 'GET') {
            $result = $conn->query("SELECT * FROM visits ORDER BY timestamp DESC");
            $visits = [];
            while($row = $result->fetch_assoc()) {
                $visits[] = $row;
            }
            sendResponse(true, "Visitas obtenidas", $visits);
        }
        break;

    case 'registerVisit':
        if ($method === 'POST' && isset($data->userId)) {
            $userId = $conn->real_escape_string($data->userId);
            
            // Check if user is employee or normal user
            $role = '';
            $userName = '';
            $note = '';

            if (strpos($userId, 'T') === 0) {
                $role = 'employee';
                $result = $conn->query("SELECT name FROM employees WHERE id='$userId'");
                if ($result->num_rows > 0) {
                    $userName = $result->fetch_assoc()['name'];
                    
                    // Verificar la última visita para determinar si es Entrada o Salida
                    $lastVisitRes = $conn->query("SELECT note FROM visits WHERE userId='$userId' ORDER BY timestamp DESC LIMIT 1");
                    if ($lastVisitRes->num_rows > 0) {
                        $lastVisit = $lastVisitRes->fetch_assoc();
                        if ($lastVisit['note'] === 'Entrada') {
                            $note = 'Salida';
                        } else {
                            $note = 'Entrada';
                        }
                    } else {
                        $note = 'Entrada'; // Primera vez
                    }
                } else {
                    sendResponse(false, "Trabajador no encontrado");
                    return;
                }
            } else {
                $role = 'user';
                $result = $conn->query("SELECT name, expirationDate FROM users WHERE id='$userId'");
                if ($result->num_rows > 0) {
                    $userData = $result->fetch_assoc();
                    $userName = $userData['name'];
                    
                    // Check expiration date
                    if (!empty($userData['expirationDate'])) {
                        $expirationDate = new DateTime($userData['expirationDate']);
                        $expirationDate->setTime(0, 0, 0); // Start of expiration day
                        $today = new DateTime();
                        $today->setTime(0, 0, 0); // Start of today
                        
                        // If expiration date is strictly before today, block access
                        if ($expirationDate < $today) {
                            sendResponse(false, "Acceso denegado: Su suscripción ha vencido.");
                            return; // Stop execution
                        }
                    }
                } else {
                    sendResponse(false, "Usuario no encontrado");
                    return; // Stop execution if user not found (avoids inserting visit with empty name)
                }
            }

            $id = uniqid(); // Generate a random string ID
            $sql = "INSERT INTO visits (id, userId, userName, role, note) VALUES ('$id', '$userId', '$userName', '$role', '$note')";
            
            if ($conn->query($sql) === TRUE) {
                $newVisit = ["id" => $id, "userId" => $userId, "userName" => $userName, "role" => $role, "note" => $note, "timestamp" => date('Y-m-d H:i:s')];
                $welcomeMsg = $role === 'employee' ? "$note registrada: $userName" : "Bienvenido: $userName";
                sendResponse(true, $welcomeMsg, $newVisit);
            } else {
                sendResponse(false, "Error al registrar visita");
            }
        }
        break;

    case 'registerOneTimeVisit':
        if ($method === 'POST' && isset($data->name)) {
            $name = $conn->real_escape_string($data->name);
            $phone = isset($data->phone) ? $conn->real_escape_string($data->phone) : '';
            $note = isset($data->note) ? $conn->real_escape_string($data->note) : 'Pase diario';
            
            $id = uniqid();
            $userId = "V" . time();
            $role = "visitor";

            $sql = "INSERT INTO visits (id, userId, userName, role, phone, note) VALUES ('$id', '$userId', '$name', '$role', '$phone', '$note')";

            if ($conn->query($sql) === TRUE) {
                $newVisit = ["id" => $id, "userId" => $userId, "userName" => $name, "role" => $role, "phone" => $phone, "note" => $note, "timestamp" => date('Y-m-d H:i:s')];
                sendResponse(true, "Visita registrada: " . $name, $newVisit);
            } else {
                sendResponse(false, "Error al registrar visita");
            }
        }
        break;

    case 'getEmployees':
        if ($method === 'GET') {
            $result = $conn->query("SELECT id, name, username, password, createdAt FROM employees");
            $employees = [];
            while($row = $result->fetch_assoc()) {
                $employees[] = $row;
            }
            sendResponse(true, "Empleados obtenidos", $employees);
        }
        break;
        
    case 'login':
        if ($method === 'POST' && isset($data->username) && isset($data->password)) {
            $username = $conn->real_escape_string($data->username);
            $password = $conn->real_escape_string($data->password);
            
            // En producción, aquí se usaría password_verify y hashes
            $sql = "SELECT id, name, username FROM employees WHERE username='$username' AND password='$password'";
            $result = $conn->query($sql);
            
            if ($result->num_rows > 0) {
                $employee = $result->fetch_assoc();
                
                // Determinar rol basado en el ID (A = Admin, T = Trabajador)
                $role = "employee";
                if (strpos($employee['id'], 'A') === 0) {
                    $role = "admin";
                }
                
                $userData = [
                    "id" => $employee['id'],
                    "username" => $employee['username'],
                    "name" => $employee['name'],
                    "role" => $role
                ];
                sendResponse(true, "Login exitoso", $userData);
            } else {
                sendResponse(false, "Credenciales incorrectas");
            }
        }
        break;

    case 'addEmployee':
        if ($method === 'POST' && isset($data->name)) {
            $name = $conn->real_escape_string($data->name);
            $username = $conn->real_escape_string($data->username);
            $password = $conn->real_escape_string($data->password); // In a real app, hash this!

            $shortId = 'T' . rand(1000, 9999);
            
            $sql = "INSERT INTO employees (id, name, username, password) VALUES ('$shortId', '$name', '$username', '$password')";
            
            if ($conn->query($sql) === TRUE) {
                $newEmployee = ["id" => $shortId, "name" => $name, "username" => $username, "createdAt" => date('Y-m-d H:i:s')];
                sendResponse(true, "Empleado agregado", $newEmployee);
            } else {
                sendResponse(false, "Error al agregar empleado");
            }
        }
        break;

    case 'deleteEmployee':
        if ($method === 'DELETE' && isset($_GET['id'])) {
           $id = $conn->real_escape_string($_GET['id']);
           if ($conn->query("DELETE FROM employees WHERE id='$id'") === TRUE) {
               sendResponse(true, "Empleado eliminado", $id);
           } else {
               sendResponse(false, "Error eliminando empleado");
           }
        }
        break;

    case 'getPrices':
        if ($method === 'GET') {
            $result = $conn->query("SELECT monthly, annual FROM prices LIMIT 1");
            if ($result->num_rows > 0) {
                sendResponse(true, "Precios obtenidos", $result->fetch_assoc());
            } else {
                 sendResponse(true, "Precios obtenidos", ["monthly" => 500, "annual" => 5000]);
            }
        }
        break;

    case 'updatePrices':
        if ($method === 'PUT' && isset($data->monthly)) {
            $monthly = (float)$data->monthly;
            $annual = (float)$data->annual;

            $sql = "UPDATE prices SET monthly = $monthly, annual = $annual";
            if ($conn->query($sql) === TRUE) {
                 sendResponse(true, "Precios actualizados", ["monthly" => $monthly, "annual" => $annual]);
            } else {
                sendResponse(false, "Error actualizando precios");
            }
        }
        break;

    case 'getProducts':
        if ($method === 'GET') {
            $result = $conn->query("SELECT * FROM products ORDER BY name ASC");
            $products = [];
            while($row = $result->fetch_assoc()) {
                $products[] = $row;
            }
            sendResponse(true, "Productos obtenidos", $products);
        }
        break;

    case 'addProduct':
        if ($method === 'POST' && isset($data->name) && isset($data->price)) {
            $name = $conn->real_escape_string($data->name);
            $price = (float)$data->price;
            $stock = isset($data->stock) ? (int)$data->stock : 0;
            $capacity = isset($data->capacity) && $data->capacity !== '' ? (int)$data->capacity : "NULL";
            $unit = isset($data->unit) && $data->unit !== '' ? "'" . $conn->real_escape_string($data->unit) . "'" : "NULL";
            
            $sql = "INSERT INTO products (name, price, stock, capacity, unit) VALUES ('$name', $price, $stock, $capacity, $unit)";
            if ($conn->query($sql) === TRUE) {
                $newId = $conn->insert_id;
                $newProduct = [
                    "id" => $newId,
                    "name" => $name,
                    "price" => $price,
                    "stock" => $stock,
                    "capacity" => isset($data->capacity) ? $data->capacity : null,
                    "unit" => isset($data->unit) ? $data->unit : null,
                    "createdAt" => date('Y-m-d H:i:s')
                ];
                sendResponse(true, "Producto agregado exitosamente", $newProduct);
            } else {
                sendResponse(false, "Error al agregar producto: " . $conn->error);
            }
        }
        break;

    case 'deleteProduct':
        if ($method === 'DELETE' && isset($_GET['id'])) {
            $id = (int)$_GET['id'];
            if ($conn->query("DELETE FROM products WHERE id=$id") === TRUE) {
                sendResponse(true, "Producto eliminado", $id);
            } else {
                sendResponse(false, "Error eliminando producto");
            }
        }
        break;

    case 'updateStock':
        if ($method === 'PUT' && isset($data->id) && isset($data->quantity)) {
            $id = (int)$data->id;
            $quantity = (int)$data->quantity; 
            
            $sql = "UPDATE products SET stock = stock + $quantity WHERE id = $id";
            if ($conn->query($sql) === TRUE) {
                sendResponse(true, "Stock actualizado exitosamente", ["id" => $id, "addedQuantity" => $quantity]);
            } else {
                sendResponse(false, "Error al actualizar stock: " . $conn->error);
            }
        }
        break;

    case 'getSales':
        if ($method === 'GET') {
            $result = $conn->query("SELECT * FROM sales ORDER BY timestamp DESC");
            $sales = [];
            while($row = $result->fetch_assoc()) {
                $sales[] = $row;
            }
            sendResponse(true, "Ventas obtenidas", $sales);
        }
        break;

    case 'registerSale':
        if ($method === 'POST' && isset($data->productId) && isset($data->quantity) && isset($data->soldBy)) {
            $productId = (int)$data->productId;
            $quantity = (int)$data->quantity;
            $soldBy = $conn->real_escape_string($data->soldBy);
            $paymentType = isset($data->paymentType) ? $conn->real_escape_string($data->paymentType) : 'efectivo';

            $result = $conn->query("SELECT name, price, stock FROM products WHERE id = $productId");
            if ($result->num_rows > 0) {
                $product = $result->fetch_assoc();
                
                $currentStock = (int)$product['stock'];
                if ($currentStock < $quantity) {
                    sendResponse(false, "Stock insuficiente para realizar la venta (Stock: $currentStock, Requerido: $quantity)");
                }

                $productName = $product['name'];
                $price = (float)$product['price'];
                $total = $price * $quantity;

                $id = uniqid("VNT-");

                $conn->begin_transaction();
                try {
                    $insertSale = "INSERT INTO sales (id, productId, productName, quantity, total, soldBy, paymentType) 
                                   VALUES ('$id', $productId, '$productName', $quantity, $total, '$soldBy', '$paymentType')";
                    $updateStock = "UPDATE products SET stock = stock - $quantity WHERE id = $productId";

                    if ($conn->query($insertSale) === TRUE && $conn->query($updateStock) === TRUE) {
                        $conn->commit();
                        
                        $newSale = [
                            "id" => $id,
                            "productId" => $productId,
                            "productName" => $productName,
                            "quantity" => $quantity,
                            "total" => $total,
                            "soldBy" => $soldBy,
                            "paymentType" => $paymentType,
                            "timestamp" => date('Y-m-d H:i:s')
                        ];
                        sendResponse(true, "Venta registrada con éxito", $newSale);
                    } else {
                        throw new Exception("Error en la base de datos: " . $conn->error);
                    }
                } catch (Exception $e) {
                    $conn->rollback();
                    sendResponse(false, "Error al registrar venta: " . $e->getMessage());
                }
            } else {
                sendResponse(false, "Producto no encontrado");
            }
        }
        break;

    case 'getDonations':
        if ($method === 'GET') {
            $result = $conn->query("SELECT * FROM donations ORDER BY timestamp DESC");
            $donations = [];
            while($row = $result->fetch_assoc()) {
                $donations[] = $row;
            }
            sendResponse(true, "Donaciones obtenidas", $donations);
        }
        break;

    case 'registerDonation':
        if ($method === 'POST' && isset($data->productId) && isset($data->quantity) && isset($data->donatedBy)) {
            $productId = (int)$data->productId;
            $quantity = (int)$data->quantity;
            $donatedBy = $conn->real_escape_string($data->donatedBy);

            $result = $conn->query("SELECT name, stock FROM products WHERE id = $productId");
            if ($result->num_rows > 0) {
                $product = $result->fetch_assoc();
                
                $currentStock = (int)$product['stock'];
                if ($currentStock < $quantity) {
                    sendResponse(false, "Stock insuficiente para realizar la donación (Stock: $currentStock, Requerido: $quantity)");
                }

                $productName = $product['name'];
                $id = uniqid("DON-");

                $conn->begin_transaction();
                try {
                    $conn->query("UPDATE products SET stock = stock - $quantity WHERE id = $productId");
                    $sql = "INSERT INTO donations (id, productId, productName, quantity, donatedBy) 
                            VALUES ('$id', $productId, '$productName', $quantity, '$donatedBy')";
                    $conn->query($sql);
                    $conn->commit();

                    $newDonation = [
                        "id" => $id,
                        "productId" => $productId,
                        "productName" => $productName,
                        "quantity" => $quantity,
                        "donatedBy" => $donatedBy,
                        "timestamp" => date('Y-m-d H:i:s')
                    ];
                    sendResponse(true, "Donación registrada con éxito", $newDonation);
                } catch (Exception $e) {
                    $conn->rollback();
                    sendResponse(false, "Error al registrar donación: " . $e->getMessage());
                }
            } else {
                sendResponse(false, "Producto no encontrado");
            }
        }
        break;
        
    default:
        sendResponse(false, "Acción no válida");
        break;
}

$conn->close();
?>
