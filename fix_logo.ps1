@" 
import sys 
file_path = r"c:\Users\Martin\Desktop\Contrato\PROYECTO-GOLAZO\src\App.tsx" 
with open(file_path, "r") as f: 
    content = f.read() 
old = "localStorage.getItem(
golazo_custom_logo)" 
new = "localStorage.getItem(golazo_client_logo_ + selectedClientId)" if selectedClientId else "localStorage.getItem(golazo_custom_logo)" 
content = content.replace(old, new) 
with open(file_path, "w") as f: 
    f.write(content) 
print("done") 
@
