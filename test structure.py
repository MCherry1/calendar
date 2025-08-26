import numpy as np
from scipy.integrate import solve_ivp
import matplotlib.pyplot as plt

# m*x'' + k*x = 0  ->  y=[x,v], y'=[v, -omega^2 x]
omega = 2*np.pi*1.0  # 1 Hz
def f(t, y): return [y[1], -(omega**2)*y[0]]

t_span = (0.0, 5.0)
y0 = [1.0, 0.0]  # x(0)=1, v(0)=0
sol = solve_ivp(f, t_span, y0, max_step=1e-2, rtol=1e-9, atol=1e-12, dense_output=True)

t = np.linspace(*t_span, 2000)
x = sol.sol(t)[0]

plt.figure()
plt.plot(t, x, lw=1.5)
plt.xlabel("t [s]")
plt.ylabel("x [arb]")
plt.title("Simple Harmonic Oscillator (solve_ivp)")
plt.grid(True)
plt.show()
