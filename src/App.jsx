import React, { useState } from "react";
import { Card, CardContent, Input, Button, Label, RadioGroup, RadioGroupItem } from "./components/ui";
import { Settings2 } from "lucide-react";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function Settings({ irsRate, setIrsRate, taxRate, setTaxRate, profitRate, setProfitRate }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-2">Settings</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>IRS Mileage Rate (per mile)</Label>
          <Input
            type="number"
            step="0.01"
            value={irsRate}
            onChange={(e) => setIrsRate(parseFloat(e.target.value))}
          />
        </div>
        <div>
          <Label>Tax Rate (%)</Label>
          <Input
            type="number"
            step="0.01"
            value={taxRate}
            onChange={(e) => setTaxRate(parseFloat(e.target.value))}
          />
        </div>
        <div>
          <Label>Profit Rate (%)</Label>
          <Input
            type="number"
            step="0.01"
            value={profitRate}
            onChange={(e) => setProfitRate(parseFloat(e.target.value))}
          />
        </div>
        <div>
          <Label>Owner's Compensation (%)</Label>
          <Input disabled value={(100 - taxRate - profitRate).toFixed(2)} />
        </div>
      </div>
    </div>
  );
}

export default function QuoteBuilder() {
  const [showSettings, setShowSettings] = useState(false);
  const [irsRate, setIrsRate] = useState(() => {
    const year = new Date().getFullYear();
    const rates = {
      2023: 0.655,
      2024: 0.67,
      2025: 0.7,
    };
    return rates[year] || 0.7;
  });
  const [taxRate, setTaxRate] = useState(20);
  const [profitRate, setProfitRate] = useState(10);
  const [tasks, setTasks] = useState([
    {
      name: "",
      techs: 1,
      days: 1,
      trips: 1,
      hoursPerDay: 8,
      rate: 110,
      travelRate: 50,
      travelTime: 4,
      mealCost: 100,
      hotelCost: 200,
      airfare: 0,
      carRental: 0,
      parking: 0,
      mileage: 0,
      includeHotel: true,
      includeAirfare: true,
      includeCarRental: true,
      notes: ""
    }
  ]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);

  const addTask = () => {
    const newTasks = [...tasks, { ...tasks[0] }];
    setTasks(newTasks);
    setActiveIndex(newTasks.length - 1);
  };

  const updateTask = (index, field, value) => {
    const updated = [...tasks];
    updated[index][field] = value;
    setTasks(updated);
  };

  const exportToPDF = (tasks) => {
    const doc = new jsPDF();
    const headers = [[
      'Service', 'Techs', 'Days', 'Trips', 'HoursPerDay', 'Rate', 'TravelRate', 'TravelTime', 'MealCost', 'HotelCost', 'Airfare', 'CarRental', 'Parking', 'Mileage', 'Labor', 'Travel', 'AirfareTotal', 'CarRentalTotal', 'Hotel', 'Meals', 'MileageCost', 'Subtotal', 'Notes'
    ]];
    const rows = tasks.map((task, i) => {
      const result = calculate(task);
      return [
        task.name || `Service ${i + 1}`,
        task.techs,
        task.days,
        task.trips,
        task.hoursPerDay,
        task.rate,
        task.travelRate,
        task.travelTime,
        task.mealCost,
        task.hotelCost,
        task.airfare,
        task.carRental,
        task.parking,
        task.mileage,
        result.labor.toFixed(2),
        result.travel.toFixed(2),
        result.airfare.toFixed(2),
        result.carRental.toFixed(2),
        result.lodging.toFixed(2),
        result.meals.toFixed(2),
        result.mileageCost.toFixed(2),
        result.subtotal.toFixed(2),
        task.notes || ''
      ];
    });
    doc.autoTable({ head: headers, body: rows, startY: 10 });
    doc.save('quote.pdf');
  };

  const exportToXLSX = (tasks) => {
    const rows = tasks.map((task, i) => {
      const result = calculate(task);
      return {
        Service: task.name || `Service ${i + 1}`,
        Techs: task.techs,
        Days: task.days,
        Trips: task.trips,
        HoursPerDay: task.hoursPerDay,
        Rate: task.rate,
        TravelRate: task.travelRate,
        TravelTime: task.travelTime,
        MealCost: task.mealCost,
        HotelCost: task.hotelCost,
        Airfare: task.airfare,
        CarRental: task.carRental,
        Parking: task.parking,
        Mileage: task.mileage,
        Notes: task.notes,
        Labor: result.labor,
        Travel: result.travel,
        AirfareTotal: result.airfare,
        CarRentalTotal: result.carRental,
        Hotel: result.lodging,
        Meals: result.meals,
        MileageCost: result.mileageCost,
        Subtotal: result.subtotal,
        Tax: result.tax,
        Profit: result.profit,
        Compensation: result.comp,
        Total: result.total
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Quote');
    XLSX.writeFile(workbook, 'quote.xlsx');
  };

  const calculate = (task) => {
    const labor = task.techs * task.days * task.hoursPerDay * task.rate * task.trips;
    const travel = task.travelRate * task.travelTime * task.days * task.trips;
    const airfare = task.includeAirfare ? task.airfare * task.trips : 0;
    const carRental = task.includeCarRental ? task.carRental * task.trips : 0;
    const parking = task.parking * task.trips;
    const lodging = task.includeHotel ? task.days * task.trips * task.hotelCost : 0;
    const meals = task.days * task.trips * task.mealCost;
    const mileageCost = task.mileage * task.trips * irsRate;
    const subtotal = labor + travel + airfare + carRental + parking + lodging + meals + mileageCost;
    const tax = subtotal * (taxRate / 100);
    const profit = subtotal * (profitRate / 100);
    const comp = subtotal * ((100 - taxRate - profitRate) / 100);
    const expenses = lodging + airfare + carRental + parking + meals + mileageCost; // Expenses now include these categories
    const compensationMinusExpenses = comp - expenses; // New line for Compensation minus Expenses
    const total = subtotal + tax + profit + comp;
    return { labor, travel, airfare, carRental, parking, lodging, meals, mileageCost, subtotal, tax, profit, expenses, comp, compensationMinusExpenses, total };
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b">
        <img src="/logo.png" alt="immersiveLX Logo" className="h-10" />
        <h1 className="text-2xl font-bold">immersiveLX Quote Builder</h1>
        <Button variant="ghost" size="icon" onClick={() => setShowSettings(!showSettings)} title="Settings">
          <Settings2 className="h-5 w-5 transition-transform duration-300" style={{ transform: showSettings ? 'rotate(90deg)' : 'rotate(0deg)' }} />
        </Button>
      </div>

      <div className={`transition-all duration-500 overflow-hidden ${showSettings ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
        <Settings
          irsRate={irsRate}
          setIrsRate={setIrsRate}
          taxRate={taxRate}
          setTaxRate={setTaxRate}
          profitRate={profitRate}
          setProfitRate={setProfitRate}
        />
      </div>

      <div className="flex gap-4">
        <Button onClick={addTask} className="bg-black text-white hover:bg-gray-900">Add Service</Button>
        <Button variant="outline" onClick={() => exportToXLSX(tasks)}>Export to Excel</Button>
        <Button variant="outline" onClick={() => exportToPDF(tasks)}>Export to PDF</Button>
        <Button variant="outline" onClick={() => setShowAll(!showAll)}>
          {showAll ? 'Collapse All' : 'Show All'}
        </Button>
      </div>

      {tasks.map((task, i) => {
        const results = calculate(task);
        return (
          <Card key={i}>
            <div className="bg-gray-100 px-4 py-2 cursor-pointer text-sm font-semibold border-b border-gray-300" onClick={() => setActiveIndex(i)}>
              Service {i + 1}
            </div>
            <CardContent className={`space-y-4 p-4 transition-all duration-500 ease-in-out overflow-hidden ${!showAll && activeIndex !== i ? 'max-h-0 opacity-0' : 'max-h-screen opacity-100'}`}>
              <div className="col-span-full border rounded-md p-2 bg-gray-50">
                <h3 className="text-lg font-semibold mb-2">Service</h3>
                <Input value={task.name} onChange={(e) => updateTask(i, "name", e.target.value)} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-2">
                <h3 className="text-lg font-semibold mb-2 col-span-full">Labor</h3>
                {["techs", "days", "trips", "hoursPerDay", "rate"].map((field, idx) => (
                  <div key={field}>
                    <Label>{["Quantity of Techs", "Days per Trip", "Trips", "Labor Hours per Day", "Labor Rate"][idx]}</Label>
                    <Input type="number" value={task[field]} onChange={(e) => updateTask(i, field, parseFloat(e.target.value))} />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-2 mt-2">
                <h3 className="text-lg font-semibold mb-2 col-span-full">Travel Time</h3>
                {["travelTime", "travelRate"].map((field, idx) => (
                  <div key={field}>
                    <Label>{["Round Trip Travel Hours per Day", "Travel Rate"][idx]}</Label>
                    <Input type="number" value={task[field]} onChange={(e) => updateTask(i, field, parseFloat(e.target.value))} />
                  </div>
                ))}
              </div>

              <div className="col-span-full border rounded-md p-2 bg-gray-50 mt-2">
                <h3 className="text-lg font-semibold mb-2">Expenses per Trip</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {["includeHotel", "includeAirfare", "includeCarRental"].map((field, idx) => (
                    <div key={field}>
                      <Label>{["Include Hotel", "Include Airfare", "Include Car Rental"][idx]}</Label>
                      <RadioGroup value={task[field] ? "yes" : "no"} onValueChange={(val) => updateTask(i, field, val === "yes")}> 
                        {["yes", "no"].map((val) => (
                          <div key={val} className="flex items-center space-x-2">
                            <RadioGroupItem value={val} id={`${field}-${val}`} />
                            <Label htmlFor={`${field}-${val}`}>{val.charAt(0).toUpperCase() + val.slice(1)}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  ))}
                  {["hotelCost", "airfare", "carRental", "parking", "mealCost", "mileage"].map((field, idx) => {
                    if ((field === "hotelCost" && !task.includeHotel) ||
                        (field === "airfare" && !task.includeAirfare) ||
                        (field === "carRental" && !task.includeCarRental)) return null;
                    const labels = [
                      `Hotel Cost per Night`,
                      `Airfare per Trip`,
                      `Car Rental per Trip`,
                      `Parking & Tolls per Trip`,
                      `Meal Cost per Day`,
                      `Mileage (IRS rate $${irsRate.toFixed(2)}/mi)`
                    ];
                    return (
                      <div key={field}>
                        <Label>{labels[idx]}</Label>
                        <Input type="number" value={task[field]} onChange={(e) => updateTask(i, field, parseFloat(e.target.value))} />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="col-span-full border rounded-md p-2 bg-gray-50 mt-2">
                <h3 className="text-lg font-semibold mb-2">Notes</h3>
                <Input
                  type="text"
                  value={task.notes || ''}
                  onChange={(e) => updateTask(i, 'notes', e.target.value)}
                  placeholder="Enter any notes for this service..."
                />
              </div>

              <div className="pt-4 border-t mt-4 text-sm text-gray-600">
                <strong>Summary:</strong> {task.name || 'Untitled'}<br />
                Labor: ${results.labor.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} | Travel: ${results.travel.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} | Airfare: ${results.airfare.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} | Car Rental: ${results.carRental.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br />
                Hotel: ${results.lodging.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} | Meals: ${results.meals.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} | Mileage: ${results.mileageCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br />
                Tax: ${results.tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} | Expenses: ${results.expenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} | Profit: ${results.profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} | Compensation: ${results.comp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} | Compensation minus Expenses: ${results.compensationMinusExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br />
              </div>
            </CardContent>
          </Card>
        );
      })}

      <div className="pt-6 border-t">
        <h2 className="text-xl font-semibold mb-2">Grand Total</h2>
        <div className="space-y-2 text-sm">
          {tasks.map((task, i) => {
            const result = calculate(task);
            return (
              <p key={i}>
                <strong>{task.name || 'Untitled'}:</strong> {task.techs} tech(s), {task.days} day(s), {task.trips} trip(s) — <strong>${result.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
              </p>
            );
          })}
        </div>
        <p className="text-lg font-bold mt-4">
          Total: ${tasks.reduce((sum, task) => sum + calculate(task).subtotal, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
    </div>
  );
}
