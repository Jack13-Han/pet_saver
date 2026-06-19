<?php
$lines = file('api/index.php');
foreach ($lines as $num => $line) {
    if (strpos($line, '<<<<<<<') !== false || strpos($line, '=======') !== false || strpos($line, '>>>>>>>') !== false) {
        echo ($num + 1) . ': ' . $line . "\n";
    }
}

$linesGoals = file('frontend/src/pages/Goals.jsx');
foreach ($linesGoals as $num => $line) {
    if (strpos($line, '<<<<<<<') !== false || strpos($line, '=======') !== false || strpos($line, '>>>>>>>') !== false) {
        echo "GOALS " . ($num + 1) . ': ' . $line . "\n";
    }
}
