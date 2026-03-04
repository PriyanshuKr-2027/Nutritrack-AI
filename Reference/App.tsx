import React, { useState } from "react";
import { BottomNav } from "./components/BottomNav";
import { DashboardView } from "./components/DashboardView";
import { CameraView } from "./components/CameraView";
import { ScanningView } from "./components/ScanningView";
import { EditEntryView, Ingredient, SAMOSA_DATA, FoodItemData } from "./components/EditEntryView";
import { AddIngredientView } from "./components/AddIngredientView";
import { FinalResultsView } from "./components/FinalResultsView";
import { SearchFoodView } from "./components/SearchFoodView";
import { CreateCustomFoodView } from "./components/CreateCustomFoodView";
import { ScanLabelView } from "./components/ScanLabelView";
import { HistoryView, HistoryItem } from "./components/HistoryView";
import { MealDetailView, MealDetailData } from "./components/MealDetailView";
import { DayDetailView } from "./components/DayDetailView";
import { TrendsView } from "./components/TrendsView";
import { OnboardingFlow } from "./components/onboarding/OnboardingFlow"; // legacy — kept but unused
import { QuickOnboardingFlow } from "./components/onboarding/QuickOnboardingFlow"; // legacy — kept but unused
import { CombinedOnboardingFlow } from "./components/onboarding/CombinedOnboardingFlow";
import type { NutritionPlan } from "./lib/nutritionCalc";
import { MultiItemConfirmView, FoodItem } from "./components/MultiItemConfirmView";
import { VoiceRecordView } from "./components/VoiceRecordView";
import { LabelResultView, LabelData } from "./components/LabelResultView";
import { LoginView } from "./components/auth/LoginView";
import { SignUpView } from "./components/auth/SignUpView";
import { ForgotPasswordView } from "./components/auth/ForgotPasswordView";
import { motion, AnimatePresence } from "motion/react";
import { ProfileView } from "./components/ProfileView";
import { ProfileViewCompact } from "./components/ProfileViewCompact";
import { Construction } from "lucide-react";
import exampleImage from "figma:asset/7a8d0ac9ac8d9305ce2247e6ab00433e9f3baee1.png";
import { LandingScreen } from "./components/LandingScreen";

export default function App() {
  // Landing state
  const [showLanding, setShowLanding] = useState(true);
  
  // Auth states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState<"login" | "signup" | "forgot">("login");
  
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  const [showCamera, setShowCamera] = useState(false);
  const [showScanning, setShowScanning] = useState(false);
  const [showEditEntry, setShowEditEntry] = useState(false);
  const [showAddIngredient, setShowAddIngredient] = useState(false);
  const [showFinalResults, setShowFinalResults] = useState(false);
  const [showSearchFood, setShowSearchFood] = useState(false);
  const [showCreateCustomFood, setShowCreateCustomFood] = useState(false);
  const [showScanLabel, setShowScanLabel] = useState(false);
  const [showDayDetail, setShowDayDetail] = useState(false);
  const [showMultiItemConfirm, setShowMultiItemConfirm] = useState(false);
  const [showVoiceRecord, setShowVoiceRecord] = useState(false);
  const [showLabelResult, setShowLabelResult] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItemData | null>(null);
  const [addedIngredients, setAddedIngredients] = useState<Ingredient[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<MealDetailData | null>(null);
  const [capturedImage, setCapturedImage] = useState<string>("");
  const [currentFlow, setCurrentFlow] = useState<"camera" | "voice" | "label" | "manual" | null>(null);
  const [selectedFoodItems, setSelectedFoodItems] = useState<FoodItem[]>([]);

  // Mock data for multi-item confirmation
  const mockMultiItems: FoodItem[] = [
    {
      id: "1",
      name: "Samosa",
      image: exampleImage,
      quantity: 2,
      calories: 280,
      caloriesPerUnit: 140,
      unit: "pieces"
    },
    {
      id: "2",
      name: "Chowmein",
      image: exampleImage,
      quantity: 1,
      calories: 450,
      caloriesPerUnit: 450,
      unit: "plate"
    }
  ];

  // Mock data for label result
  const mockLabelData: LabelData = {
    servingSize: "1 cup (240ml)",
    calories: "200",
    protein: "8",
    carbs: "24",
    fat: "8",
    sodium: "140",
    sugar: "12"
  };

  // Handle Capture from Camera
  const handleCapture = () => {
    // In a real app, capture actual photo here
    setCapturedImage(exampleImage);
    setCurrentFlow("camera");
    setShowScanning(true);
    setShowCamera(false); 
  };

  const handleScanningComplete = () => {
    setShowScanning(false);
    // For multi-item flow
    setShowMultiItemConfirm(true);
  };

  const handleScanningTimeout = () => {
    setShowScanning(false);
    // Timeout fallback - go to manual search
    setCurrentFlow("manual");
    setShowSearchFood(true);
  };

  const handleMultiItemConfirm = (items: FoodItem[]) => {
    setShowMultiItemConfirm(false);
    setShowFinalResults(true);
  };

  const handleMultiItemBack = () => {
    setShowMultiItemConfirm(false);
    // Navigate back based on which flow we came from
    if (currentFlow === "manual") {
      setShowSearchFood(true);
    }
    // For camera and voice flows, just close (goes back to dashboard)
  };

  const handleMultiItemAddMore = () => {
    // Open search to add more items
    setShowMultiItemConfirm(false);
    setShowSearchFood(true);
  };

  const handleConfirmEntry = () => {
    setShowEditEntry(false);
    setShowFinalResults(true);
  };

  const handleFinalBack = () => {
    setShowFinalResults(false);
    // Navigate back based on which flow we came from
    if (currentFlow === "camera" || currentFlow === "voice" || currentFlow === "manual") {
      setShowMultiItemConfirm(true);
    } else if (currentFlow === "label") {
      setShowLabelResult(true);
    } else {
      setShowEditEntry(true);
    }
  };

  const handleFinalDone = () => {
    setShowFinalResults(false);
    setAddedIngredients([]);
    setCurrentFlow(null);
    setCapturedImage("");
    setSelectedFoodItems([]);
    setActiveTab("home");
  };

  const handleAddIngredient = (ingredient: any) => {
    // Add new ingredient to the list
    const newIngredient: Ingredient = {
      id: `new-${Date.now()}`,
      name: ingredient.name,
      detail: ingredient.detail,
      amount: ingredient.amount,
      // Default icon for added ingredients
      icon: <div className="w-3 h-3 bg-green-500 rounded-full" />
    };
    
    setAddedIngredients(prev => [...prev, newIngredient]);
    setShowAddIngredient(false);
  };

  const handleOpenSearch = () => {
    setShowSearchFood(true);
  };

  const handleSearchBack = () => {
    setShowSearchFood(false);
  };

  const handleSearchSelect = (foodDataArray: FoodItemData[]) => {
    // Convert selected foods to FoodItem format for MultiItemConfirmView
    const newFoodItems: FoodItem[] = foodDataArray.map((data, index) => ({
      id: `manual-${Date.now()}-${index}`, // Unique ID with timestamp
      name: data.name,
      image: data.image,
      quantity: data.defaultQuantity,
      calories: data.defaultQuantity * 140, // Mock calories per unit
      caloriesPerUnit: 140,
      unit: data.unit
    }));
    
    // If we're adding more items (currentFlow is already "manual" and we have existing items),
    // merge with existing items. Otherwise, replace.
    if (currentFlow === "manual" && selectedFoodItems.length > 0) {
      setSelectedFoodItems([...selectedFoodItems, ...newFoodItems]);
    } else {
      setSelectedFoodItems(newFoodItems);
    }
    
    setCurrentFlow("manual");
    setShowSearchFood(false);
    setShowMultiItemConfirm(true);
  };

  const handleCustomFood = () => {
    setShowSearchFood(false);
    setShowCreateCustomFood(true);
  };

  const handleCreateCustomFoodBack = () => {
    setShowCreateCustomFood(false);
    setShowSearchFood(true);
  };

  const handleCreateCustomFoodComplete = (data: FoodItemData) => {
    setSelectedFood(data);
    setShowCreateCustomFood(false);
    setShowEditEntry(true);
  };

  const handleScanLabelOpen = () => {
    setShowScanLabel(true);
  };

  const handleScanLabelClose = () => {
    setShowScanLabel(false);
  };

  const handleScanLabelCapture = () => {
    // Simulate capture - go directly to results after brief scanning
    setShowScanLabel(false);
    setTimeout(() => {
      setShowLabelResult(true);
    }, 500);
  };

  const handleOpenVoice = () => {
    setShowVoiceRecord(true);
  };

  const handleVoiceComplete = (transcript: string) => {
    // Parse transcript and show multi-item confirm
    console.log("Voice transcript:", transcript);
    setCurrentFlow("voice");
    setShowVoiceRecord(false);
    setShowMultiItemConfirm(true);
  };

  const handleLabelResultConfirm = (data: LabelData, servings: number) => {
    console.log("Label data confirmed:", data, servings);
    setCurrentFlow("label");
    setShowLabelResult(false);
    setShowFinalResults(true);
  };


  const handleHistoryItemSelect = (item: HistoryItem, dateContext: string) => {
    // Convert HistoryItem to MealDetailData
    // In a real app, this might involve fetching more data
    const detailData: MealDetailData = {
      id: item.id,
      name: item.name,
      image: item.image,
      calories: item.calories,
      mealType: item.mealType,
      timestamp: `${dateContext === "Today" ? "Today" : dateContext}, ${item.time}`,
      macros: {
        protein: { value: 30, max: 50, color: "bg-green-500" }, // Mock data
        carbs: { value: 45, max: 100, color: "bg-yellow-500" }, // Mock data
        fat: { value: 15, max: 30, color: "bg-blue-500" }       // Mock data
      },
      ingredients: [
        { name: "Ingredient 1", amount: "100g" },
        { name: "Ingredient 2", amount: "50g" }
      ]
    };
    setSelectedHistoryItem(detailData);
  };

  const handleOpenDayDetail = () => {
    setShowDayDetail(true);
  };

  return (
    <div className="h-screen w-full bg-black text-white flex flex-col overflow-hidden font-sans select-none">
      {/* Landing Screen */}
      {showLanding ? (
        <LandingScreen onComplete={() => setShowLanding(false)} />
      ) : (
        <>
          {/* Auth Flow */}
          {!isAuthenticated ? (
            <AnimatePresence mode="wait">
              {authView === "login" && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <LoginView
                    onLogin={() => setIsAuthenticated(true)}
                    onSignUp={() => setAuthView("signup")}
                    onForgotPassword={() => setAuthView("forgot")}
                    onGoogleSignIn={() => setIsAuthenticated(true)}
                  />
                </motion.div>
              )}

              {authView === "signup" && (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <SignUpView
                    onSignUp={() => setIsAuthenticated(true)}
                    onLogin={() => setAuthView("login")}
                    onGoogleSignIn={() => setIsAuthenticated(true)}
                    onBack={() => setAuthView("login")}
                  />
                </motion.div>
              )}

              {authView === "forgot" && (
                <motion.div
                  key="forgot"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <ForgotPasswordView
                    onBack={() => setAuthView("login")}
                    onSubmit={() => setAuthView("login")}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          ) : (
            <>
              {/* Onboarding Flow */}
              {showOnboarding ? (
                <CombinedOnboardingFlow
                  onComplete={(plan: NutritionPlan) => {
                    // TODO: save plan to Supabase profiles table here
                    // supabase.from('profiles').update({
                    //   calorie_goal:   plan.goalCalories,
                    //   protein_goal_g: plan.protein,
                    //   carbs_goal_g:   plan.carbs,
                    //   fat_goal_g:     plan.fat,
                    // }).eq('id', user.id)
                    setShowOnboarding(false);
                  }}
                />
              ) : (
                <>
                  <AnimatePresence>
                    {showDayDetail && (
                       <motion.div
                        key="dayDetail"
                        initial={{ opacity: 0, x: "100%" }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-0 z-[190] bg-black"
                      >
                        <DayDetailView 
                          onBack={() => setShowDayDetail(false)}
                          onMealTypeSelect={(type) => {
                             // In a real app, filtering logic would go here
                             console.log("Selected meal type from day view:", type);
                             // We could open a filtered history view or similar
                          }}
                        />
                      </motion.div>
                    )}

                    {selectedHistoryItem && (
                      <motion.div
                        key="mealDetail"
                        initial={{ opacity: 0, x: "100%" }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-0 z-[200] bg-black"
                      >
                        <MealDetailView
                          data={selectedHistoryItem}
                          onBack={() => setSelectedHistoryItem(null)}
                          onEdit={() => {
                            // Handle edit logic (e.g. open EditEntryView with prefilled data)
                            console.log("Edit meal", selectedHistoryItem.id);
                          }}
                          onDelete={() => {
                            // Handle delete logic
                            console.log("Delete meal", selectedHistoryItem.id);
                            setSelectedHistoryItem(null);
                          }}
                        />
                      </motion.div>
                    )}

                    {showCamera && (
                      <motion.div 
                        key="camera"
                        initial={{ opacity: 0, y: "100%" }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: "100%" }}
                        className="fixed inset-0 z-[100] bg-black"
                      >
                        <CameraView 
                          onClose={() => setShowCamera(false)} 
                          onCapture={handleCapture}
                        />
                      </motion.div>
                    )}
                    
                    {showScanning && (
                      <motion.div 
                        key="scanning"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] bg-black"
                      >
                        <ScanningView 
                          onClose={() => setShowScanning(false)}
                          onComplete={handleScanningComplete}
                          onTimeout={handleScanningTimeout}
                        />
                      </motion.div>
                    )}

                    {showEditEntry && (
                      <motion.div 
                        key="editEntry"
                        initial={{ y: "100%" }}
                        animate={{ y: 0, scale: showAddIngredient ? 0.95 : 1, filter: showAddIngredient ? "brightness(0.5)" : "brightness(1)" }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-0 z-[120] bg-black rounded-t-3xl overflow-hidden shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.8)] border-t border-zinc-800"
                        style={{ top: "2%" }} // Slight offset to show it's a drawer/sheet
                      >
                        <EditEntryView 
                          onBack={() => setShowEditEntry(false)}
                          onConfirm={handleConfirmEntry}
                          onAddIngredient={() => setShowAddIngredient(true)}
                          initialData={selectedFood || undefined}
                          addedIngredients={addedIngredients}
                        />
                      </motion.div>
                    )}

                    {showAddIngredient && (
                      <motion.div 
                        key="addIngredient"
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-0 z-[130] bg-black rounded-t-3xl overflow-hidden shadow-2xl shadow-black"
                        style={{ top: "5%" }} // Drawer effect: leaves a bit of space at top
                      >
                        <AddIngredientView 
                          onBack={() => setShowAddIngredient(false)}
                          onAdd={handleAddIngredient}
                        />
                      </motion.div>
                    )}

                    {showFinalResults && (
                      <motion.div 
                        key="finalResults"
                        initial={{ opacity: 0, x: "100%" }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-0 z-[140] bg-black"
                      >
                        <FinalResultsView 
                          onBack={handleFinalBack}
                          onDone={handleFinalDone}
                        />
                      </motion.div>
                    )}

                    {showSearchFood && (
                      <motion.div 
                        key="searchFood"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed inset-0 z-[150] bg-black"
                      >
                        <SearchFoodView 
                          onBack={handleSearchBack}
                          onSelect={handleSearchSelect}
                          onCustomFood={handleCustomFood}
                        />
                      </motion.div>
                    )}

                    {showCreateCustomFood && (
                      <motion.div 
                        key="createCustomFood"
                        initial={{ opacity: 0, x: "100%" }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-0 z-[160] bg-black"
                      >
                        <CreateCustomFoodView 
                          onBack={handleCreateCustomFoodBack}
                          onComplete={handleCreateCustomFoodComplete}
                        />
                      </motion.div>
                    )}

                    {showScanLabel && (
                      <motion.div 
                        key="scanLabel"
                        initial={{ opacity: 0, y: "100%" }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-0 z-[170] bg-black"
                      >
                        <ScanLabelView 
                          onClose={handleScanLabelClose}
                          onCapture={handleScanLabelCapture}
                          onGallery={() => {}}
                        />
                      </motion.div>
                    )}

                    {showMultiItemConfirm && (
                      <motion.div 
                        key="multiItemConfirm"
                        initial={{ opacity: 0, x: "100%" }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-0 z-[180] bg-black"
                      >
                        <MultiItemConfirmView 
                          initialItems={currentFlow === "manual" ? selectedFoodItems : mockMultiItems}
                          capturedImage={currentFlow === "manual" ? "" : capturedImage}
                          onBack={handleMultiItemBack}
                          onConfirm={handleMultiItemConfirm}
                          onAddItem={handleMultiItemAddMore}
                        />
                      </motion.div>
                    )}

                    {showVoiceRecord && (
                      <motion.div 
                        key="voiceRecord"
                        initial={{ opacity: 0, x: "100%" }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-0 z-[190] bg-black"
                      >
                        <VoiceRecordView 
                          onClose={() => setShowVoiceRecord(false)}
                          onComplete={handleVoiceComplete}
                        />
                      </motion.div>
                    )}

                    {showLabelResult && (
                      <motion.div 
                        key="labelResult"
                        initial={{ opacity: 0, x: "100%" }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-0 z-[200] bg-black"
                      >
                        <LabelResultView 
                          initialData={mockLabelData}
                          capturedImage={capturedImage}
                          onBack={() => setShowLabelResult(false)}
                          onConfirm={handleLabelResultConfirm}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <main className="flex-1 overflow-y-auto overflow-x-hidden relative scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <AnimatePresence mode="wait">
                      {activeTab === "home" && (
                        <motion.div
                          key="home"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="min-h-full"
                        >
                          <DashboardView 
                            onOpenCam={() => setShowCamera(true)} 
                            onOpenSearch={handleOpenSearch}
                            onOpenScanLabel={handleScanLabelOpen}
                            onOpenDayDetail={handleOpenDayDetail}
                            onOpenVoice={handleOpenVoice}
                          />
                        </motion.div>
                      )}

                      {activeTab === "history" && (
                        <motion.div
                          key="history"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="h-full"
                        >
                          <HistoryView 
                            onBack={() => setActiveTab("home")}
                            onLogMeal={() => {
                              setActiveTab("home");
                              // Ideally trigger the FAB or search directly, but going home is fine for now
                            }}
                            onSelectMeal={handleHistoryItemSelect}
                          />
                        </motion.div>
                      )}

                      {activeTab === "trends" && (
                        <motion.div
                          key="trends"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="h-full"
                        >
                          <TrendsView />
                        </motion.div>
                      )}

                      {activeTab === "profile" && (
                        <motion.div
                          key="profile"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="h-full"
                        >
                          <ProfileView onLogout={() => {
                            // Handle logout
                            setIsAuthenticated(false);
                            setShowOnboarding(true);
                          }} />
                        </motion.div>
                      )}

                      {activeTab !== "home" && activeTab !== "history" && activeTab !== "trends" && activeTab !== "profile" && (
                        <motion.div
                          key="other"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex flex-col items-center justify-center h-full p-6 text-center"
                        >
                          <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6 border border-zinc-800">
                            <Construction size={40} className="text-zinc-600" />
                          </div>
                          <h2 className="text-xl font-bold text-white mb-2">
                            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} View
                          </h2>
                          <p className="text-zinc-500 max-w-xs">
                            This screen is under construction.
                          </p>
                          <button 
                            onClick={() => setActiveTab('home')}
                            className="mt-8 px-6 py-3 bg-green-500 text-black font-bold rounded-full"
                          >
                            Go Home
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </main>
                  
                  <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}