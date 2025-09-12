"""
Dice rolling utilities for the VTT API
"""
import re
import random
from typing import Tuple, List
from datetime import datetime


def parse_dice_expression(expression: str) -> List[Tuple[int, int, int]]:
    """
    Parse a dice expression like "2d6+3" into components
    Returns a list of (count, sides, modifier) tuples
    """
    # Clean the expression
    expression = expression.replace(" ", "").lower()
    
    # Pattern to match dice expressions like "2d6", "1d20", "d6", "3d10+2", "2d8-1"
    pattern = r'(\d*)d(\d+)([+-]\d+)?'
    
    matches = re.findall(pattern, expression)
    
    if not matches:
        raise ValueError(f"Invalid dice expression: {expression}")
    
    components = []
    for match in matches:
        count_str, sides_str, modifier_str = match
        
        count = int(count_str) if count_str else 1
        sides = int(sides_str)
        modifier = int(modifier_str) if modifier_str else 0
        
        if count <= 0 or count > 100:
            raise ValueError(f"Invalid dice count: {count}")
        if sides <= 0 or sides > 1000:
            raise ValueError(f"Invalid dice sides: {sides}")
        
        components.append((count, sides, modifier))
    
    return components


def roll_dice(expression: str) -> Tuple[int, str, str]:
    """
    Roll dice based on an expression
    Returns (total_result, breakdown, normalized_expression)
    """
    try:
        components = parse_dice_expression(expression)
        
        total = 0
        breakdown_parts = []
        
        for count, sides, modifier in components:
            rolls = [random.randint(1, sides) for _ in range(count)]
            dice_total = sum(rolls) + modifier
            total += dice_total
            
            # Build breakdown string
            dice_str = f"{count}d{sides}"
            if len(rolls) == 1:
                roll_detail = f"[{rolls[0]}]"
            else:
                roll_detail = f"[{'+'.join(map(str, rolls))}]"
            
            if modifier != 0:
                modifier_str = f"{modifier:+d}"
                breakdown_parts.append(f"{dice_str}: {roll_detail}{modifier_str} = {dice_total}")
            else:
                breakdown_parts.append(f"{dice_str}: {roll_detail} = {dice_total}")
        
        breakdown = " | ".join(breakdown_parts)
        
        return total, breakdown, expression
        
    except Exception as e:
        raise ValueError(f"Error rolling dice: {str(e)}")


def validate_dice_expression(expression: str) -> bool:
    """
    Validate if a dice expression is valid
    """
    try:
        parse_dice_expression(expression)
        return True
    except ValueError:
        return False