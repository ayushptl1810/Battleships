import random
import numpy as np

class Board:
    def __init__(self, size=10):
        self.size = size
        self.matrix = np.full((self.size, self.size), ' ~', dtype=object)
    
    def check_ship_placement(self, row, col, direction, ship_length):
        if direction == 'Horizontal':
            if col + ship_length > self.size:
                return False
            
            elif (col > 0 and self.matrix[row, col - 1] in ('SH')) or (col + ship_length + 1 < self.size and self.matrix[row, col + ship_length + 1] in ('SH')):
                return False
            
            for i in range(ship_length):
                if self.matrix[row, col + i] != ' ~':
                    return False 
        else:
            if row + ship_length > self.size:
                return False
            
            elif (row > 0 and self.matrix[row - 1, col] in ('SV')) or (row + ship_length + 1 < self.size and self.matrix[row + ship_length + 1, col] in ('SV')):
                return False
            
            for i in range(ship_length):
                if self.matrix[row + i, col] != ' ~':
                    return False 
        return True

    def place_ship(self, row, col, direction, ship_length):
        if self.check_ship_placement(row, col, direction, ship_length):
            if direction == 'Horizontal':
                for i in range(ship_length):
                    self.matrix[row, col + i] = 'SH'
            else:
                for i in range(ship_length):
                    self.matrix[row + i, col] = 'SV'
    
    def hit(self, row, col):
        if self.matrix[row, col] in ('SH', 'SV'):
            return True
        else:
            return False

    def check_sunk(self, player_matrix, row, col):
        if self.matrix[row, col] == 'SH':
            return self.check_sunk_horizontal(player_matrix, row, col)
        else :
            return self.check_sunk_vertical(player_matrix, row, col)
    

    def check_sunk_horizontal(self, player_matrix, row, col):
        right_end = False
        next_col = col + 1
        while not right_end and next_col < 10:
            if player_matrix[row,next_col] in ('O1', 'O2') or (player_matrix[row, next_col] in (' ~') and self.matrix[row, next_col] in (' ~')):
                right_end = True
            elif player_matrix[row, next_col] in (' ~') and self.matrix[row, next_col] in ('SH'):
                break
                    
            next_col += 1  

        if(next_col == 10 and player_matrix[row, next_col-1] in ('X1', 'X2')):
            right_end = True
   
        left_end = False
        next_col = col - 1
        while not left_end and next_col >= 0:
            if player_matrix[row,next_col] in ('O1', 'O2') or (player_matrix[row,next_col] in (' ~') and self.matrix[row, next_col] in (' ~')):
                left_end = True
            elif player_matrix[row, next_col] in (' ~') and self.matrix[row, next_col] in ('SH'):
                break

            next_col -= 1
        
        if(next_col < 0 and player_matrix[row, next_col+1] in ('X1', 'X2')):
            left_end = True

        return left_end and right_end
    

    def check_sunk_vertical(self, player_matrix, row, col) :
        bottom_end = False
        next_row = row + 1
        while not bottom_end and next_row < 10:
            if player_matrix[next_row,col] in ('O1', 'O2') or (player_matrix[next_row,col] in (' ~') and self.matrix[next_row, col] in (' ~')):
                bottom_end = True
            elif player_matrix[next_row,col] in (' ~') and self.matrix[next_row, col] in ('SV') :
                break

            next_row += 1
        
        if(next_row == 10 and player_matrix[next_row - 1, col] in ('X1', 'X2')):
            bottom_end = True
    
        top_end = False
        next_row = row - 1
        while not top_end and next_row >= 0:
            if player_matrix[next_row,col] in ('O1', 'O2') or (player_matrix[next_row,col] in (' ~') and self.matrix[next_row, col] in (' ~')):
                top_end = True
            elif player_matrix[next_row,col] in (' ~') and self.matrix[next_row, col] in ('SV') :
                break

            next_row -= 1
        
        if(next_row < 0 and player_matrix[next_row+1, col] in ('X1', 'X2')):
            top_end = True

        return top_end and bottom_end

    
    def __str__(self):
        return str(self.matrix)       

class Player:
    def __init__(self, name, ship_lengths):
        self.name = name
        self.points = 0
        self.board = Board()
        self.tracking_board = Board()
        self.moves = []
        self.ships_remaining = list(ship_lengths)

class Game:
    def __init__(self):
        self.ship_length_list = [2, 3, 3, 4, 5]
        self.players = [Player('P1', self.ship_length_list), Player('P2', self.ship_length_list)]
        self.current_player = 0
    
    def generate_board(self, board):
        for length in self.ship_length_list:
            placed = False
            while not placed:
                direction = random.choice(['Horizontal', 'Vertical'])
                if direction == 'Horizontal':
                    start_row = random.randint(0, board.size - 1)
                    start_col = random.randint(0, board.size - length)
                else:
                    start_row = random.randint(0, board.size - length)
                    start_col = random.randint(0, board.size - 1)
                
                if board.check_ship_placement(start_row, start_col, direction, length):
                    board.place_ship(start_row, start_col, direction, length)
                    placed = True

    def play_turn(self):
        player = self.players[self.current_player]
        opponent = self.players[1 - self.current_player]
        print(f"\nPlayer {player.name}'s turn")
        print("Tracking board:")
        print(player.tracking_board)
        player_marker = '1' if self.current_player == 0 else '2' 

        
        while True:
            input_str = input('\nEnter row and column of the board to shoot (e.g 1 1): ')
            try:
                row, col = map(int, input_str.split())
                if (row, col) in player.moves:
                    print('Already fired at this target, choose another')
                elif 1 <= row <= 10 and 1 <= col <= 10:
                    player.moves.append((row, col))
                    break
                else:
                    print("Invalid input. Please enter numbers between 1 and 10.")
            except ValueError:
                print("Invalid input. Please enter two integers separated by a space.")

        hit = opponent.board.hit(row - 1, col - 1)
        if hit:
            print('HIT')
            player.points += 1
            player.tracking_board.matrix[row-1, col-1] = f'X{player_marker}'

            if opponent.board.check_sunk(player.tracking_board.matrix, row - 1, col - 1):
                if opponent.ships_remaining:
                    opponent.ships_remaining.pop()
        else:
            print('MISS')
            player.tracking_board.matrix[row-1, col-1] = f'O{player_marker}'
            self.current_player = 1 if self.current_player == 0 else 0

    def play(self):
        self.generate_board(self.players[0].board)
        self.generate_board(self.players[1].board)

        while self.players[0].ships_remaining and self.players[1].ships_remaining:
            print(f"Ships remaining P1: {len(self.players[0].ships_remaining)}, P2: {len(self.players[1].ships_remaining)}")
            self.play_turn()
            if not self.players[0].ships_remaining or not self.players[1].ships_remaining:
                break

        if not self.players[0].ships_remaining and not self.players[1].ships_remaining:
            if self.players[0].points > self.players[1].points:
                print('Game over, Player 1 wins!')
            else:
                print('Game over, Player 2 wins!')
        elif not self.players[0].ships_remaining:
            print('Game over, Player 2 wins!')
        else:
            print('Game over, Player 1 wins!')

if __name__ == "__main__":
    game = Game()
    game.play()