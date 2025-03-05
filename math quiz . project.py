import random 
import time 

OPERATORS = [ "+","-","*"]
MIN_OPERAND = 3
MAX_OPERAND = 12
TOTAL_PROBLEMS = 10

def generate_problem():
    left = random.randint(MIN_OPERAND, MAX_OPERAND)
    right = random.randint(MIN_OPERAND, MAX_OPERAND)
    operator = random.choice(OPERATORS)


    expr = str(left) + " " + operator + " " + str(right)
    answer = eval(expr)
    return expr, answer 

wrong = 0 
input("press enter to start: ")
print("-----------------")

start_time = time.time()

for i in range(TOTAL_PROBLEMS):
    expr, answer = generate_problem()
    while True:
        guess = input("problems #" + str(i + 1) + ": " + expr + " = ")
        if guess == str(answer):
            break
        wrong == 0

end_time = time.time()
total_time = end_time - start_time

print("--------------")
print("nice work! you finished in", total_time, "seconds!") 














print("welcome to my computer quiz!")

playing = input("do you want to play? : ")

if playing.lower() != "yes":
    quit()

print("okay! let's play :)")
score = 0

answer = input("what does CPU stand for? ")
if answer.lower() == "central processing unit":
    print('correct!')
    score += 1
else:
    print("incorrect!")

answer = input("what does GPU stand for? ")
if answer.lower() == "graphic processing unit":
    print('correct!')
    score += 1 
else:
    print("incorrect!")

answer = input("what does RAM stand for? ")
if answer.lower() == "random access memory":
    print('correct!')
    score += 1 
else:
    print("incorrect!")

answer = input("what does PSU stand for? ")
if answer.lower() == "power supply":
    print('correct!')
    score += 1 
else:
    print("incorrect!")

print("you got " + str(score) + "question correct!")
print("you got " + str((score / 4) * 100) + "%.")








